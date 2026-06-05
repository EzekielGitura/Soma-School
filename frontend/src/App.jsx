import { useCallback, useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Download, Plus, Save, Trash2 } from "lucide-react";

import { apiRequest, downloadPdf } from "./api.js";
import { Alert, EmptyState, Field, Layout, PageHeader, Spinner } from "./components.jsx";
import { formatDate, formatScore, formToObject, fullName } from "./utils.js";

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/streams" element={<Streams />} />
        <Route path="/streams/:id" element={<StreamDetail />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentDetail />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/scores" element={<Scores />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/grading" element={<Grading />} />
      </Routes>
    </Layout>
  );
}

function useApi(load, deps = [], initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await load());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, message, setMessage, setError, reload };
}

async function submitForm(event, path, options = {}) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = formToObject(form);
  await apiRequest(path, {
    method: options.method || "POST",
    body: options.map ? options.map(data) : data,
  });
  if (options.reset !== false) form.reset();
}

function Dashboard() {
  const state = useApi(
    () => apiRequest("/dashboard"),
    [],
    { counts: {}, streams: [], recentScores: [] },
  );
  if (state.loading) return <Spinner />;

  const counts = state.data?.counts || {};

  return (
    <>
      <PageHeader
        eyebrow="Student management"
        title="Soma School operations dashboard"
        description="Manage streams, students, subjects, scores, grading, ranking, and PDF reporting."
      />
      <Alert message={state.error} type="error" />

      <section className="stats-grid">
        <Stat label="Class streams" value={counts.classStreams || 0} />
        <Stat label="Registered students" value={counts.students || 0} />
        <Stat label="Subjects offered" value={counts.subjects || 0} />
        <Stat label="Score records" value={counts.scores || 0} />
      </section>

      <section className="two-column">
        <Card title="Class streams" subtitle="Enrollment and subject coverage by stream.">
          <div className="stack">
            {state.data?.streams?.map((stream) => (
              <Link key={stream.id} to={`/streams/${stream.id}`} className="list-row">
                <span>
                  <strong>{stream.name}</strong>
                  <small>{stream.teacherName || "No teacher"} | {stream.academicYear}</small>
                </span>
                <span>{stream.studentCount} students | {stream.subjectCount} subjects</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card title="Recent score updates" subtitle="Latest assessment activity.">
          <div className="stack">
            {state.data?.recentScores?.map((score) => (
              <div key={score.id} className="list-row">
                <span>
                  <strong>{score.firstName} {score.lastName} | {score.subjectName}</strong>
                  <small>{score.term} {score.academicYear}</small>
                </span>
                <b>{formatScore(score.totalScore)}</b>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}

function Streams() {
  const state = useApi(() => apiRequest("/streams"), [], []);

  async function create(event) {
    try {
      await submitForm(event, "/streams");
      state.setMessage("Class stream created.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function remove(id) {
    try {
      await apiRequest(`/streams/${id}`, { method: "DELETE" });
      state.setMessage("Class stream deleted.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Class stream management"
        title="Class streams"
        description="Create streams like Form 1A and view students, subjects, and class ranking."
      />
      <Alert message={state.message} />
      <Alert message={state.error} type="error" />
      <section className="two-column">
        <Card title="Create stream" subtitle="Add an active class stream.">
          <form onSubmit={create} className="form-grid">
            <Field label="Stream name"><input name="name" required placeholder="Form 1A" /></Field>
            <Field label="Class teacher"><input name="teacherName" /></Field>
            <Field label="Academic year"><input name="academicYear" type="number" defaultValue="2026" required /></Field>
            <Field label="Capacity"><input name="capacity" type="number" min="1" /></Field>
            <button className="btn primary"><Plus size={16} />Create stream</button>
          </form>
        </Card>
        <Card title="All streams" subtitle="Open a stream to view details.">
          {state.loading ? <Spinner /> : (
            <div className="stack">
              {state.data?.map((stream) => (
                <div key={stream.id} className="list-row">
                  <Link to={`/streams/${stream.id}`}>
                    <strong>{stream.name}</strong>
                    <small>{stream.teacherName || "No teacher"} | {stream.academicYear}</small>
                  </Link>
                  <span>{stream.studentCount} students | {stream.subjectCount} subjects</span>
                  <button className="btn danger" onClick={() => remove(stream.id)}><Trash2 size={15} />Delete</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </>
  );
}

function StreamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useApi(() => apiRequest(`/streams/${id}?term=Term%201&academicYear=2026`), [id]);

  async function update(event) {
    try {
      await submitForm(event, `/streams/${id}`, { method: "PUT", reset: false });
      state.setMessage("Class stream updated.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function remove() {
    try {
      await apiRequest(`/streams/${id}`, { method: "DELETE" });
      navigate("/streams");
    } catch (err) {
      state.setError(err.message);
    }
  }

  if (state.loading) return <Spinner />;
  if (!state.data) {
    return (
      <>
        <PageHeader eyebrow="Class stream details" title="Class stream unavailable" description="The class stream could not be loaded." />
        <Alert message={state.error} type="error" />
      </>
    );
  }
  const data = state.data;

  return (
    <>
      <PageHeader
        eyebrow="Class stream details"
        title={data.stream.name}
        description="View stream enrollment, assigned subjects, and automatic overall ranking."
        actions={<Link className="btn" to="/streams">Back</Link>}
      />
      <Alert message={state.message} />
      <Alert message={state.error} type="error" />
      <section className="two-column">
        <Card title="Stream profile">
          <form onSubmit={update} className="form-grid">
            <Field label="Name"><input name="name" defaultValue={data.stream.name} required /></Field>
            <Field label="Teacher"><input name="teacherName" defaultValue={data.stream.teacherName || ""} /></Field>
            <Field label="Academic year"><input name="academicYear" type="number" defaultValue={data.stream.academicYear} required /></Field>
            <Field label="Capacity"><input name="capacity" type="number" defaultValue={data.stream.capacity || ""} /></Field>
            <button className="btn primary"><Save size={16} />Save</button>
          </form>
          <button className="btn danger mt" onClick={remove}><Trash2 size={16} />Delete stream</button>
        </Card>
        <Card title="Assigned subjects">
          <div className="stack">
            {data.subjects.map((subject) => (
              <div key={subject.id} className="list-row">
                <strong>{subject.name}</strong>
                <span>{subject.code} | {subject.teacherName || "No teacher"}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
      <Card title="Students and class ranking" subtitle="Ranked by average score for Term 1 2026.">
        <Table
          headers={["Pos.", "Student", "Subjects", "Total", "Average", "Grade"]}
          rows={data.performance.map((student) => [
            student.overallPosition,
            <Link to={`/students/${student.id}`}>{student.firstName} {student.lastName}<small>{student.admissionNo}</small></Link>,
            student.scores.length,
            formatScore(student.totalMarks),
            formatScore(student.averageScore),
            student.grade,
          ])}
        />
      </Card>
    </>
  );
}

function Students() {
  const [searchParams, setSearchParams] = useSearchParams();
  const streamId = searchParams.get("streamId") || "";
  const state = useApi(
    async () => ({
      streams: await apiRequest("/streams"),
      students: await apiRequest(`/students${streamId ? `?streamId=${streamId}` : ""}`),
    }),
    [streamId],
    { streams: [], students: [] },
  );

  async function create(event) {
    try {
      await submitForm(event, "/students");
      state.setMessage("Student registered.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  if (state.loading) return <Spinner />;

  return (
    <>
      <PageHeader eyebrow="Student management" title="Students" description="Register learners and filter them by class stream." />
      <Alert message={state.message} />
      <Alert message={state.error} type="error" />
      <section className="two-column">
        <Card title="Register student">
          <form onSubmit={create} className="form-grid">
            <Field label="Admission no."><input name="admissionNo" required placeholder="IA-005" /></Field>
            <Field label="Class stream"><Select name="classStreamId" items={state.data.streams} required /></Field>
            <Field label="First name"><input name="firstName" required /></Field>
            <Field label="Last name"><input name="lastName" required /></Field>
            <Field label="Gender"><select name="gender"><option value="">Not specified</option><option>Female</option><option>Male</option></select></Field>
            <Field label="Date of birth"><input name="dateOfBirth" type="date" /></Field>
            <Field label="Guardian name"><input name="guardianName" /></Field>
            <Field label="Guardian phone"><input name="guardianPhone" /></Field>
            <button className="btn primary"><Plus size={16} />Register student</button>
          </form>
        </Card>
        <Card title="Student directory" subtitle="View all students or filter by stream.">
          <div className="toolbar">
            <select value={streamId} onChange={(event) => setSearchParams(event.target.value ? { streamId: event.target.value } : {})}>
              <option value="">All streams</option>
              {state.data.streams.map((stream) => <option key={stream.id} value={stream.id}>{stream.name}</option>)}
            </select>
          </div>
          <Table
            headers={["Student", "Stream", "Guardian", "DOB", "Action"]}
            rows={state.data.students.map((student) => [
              <><strong>{fullName(student)}</strong><small>{student.admissionNo}</small></>,
              student.classStreamName,
              <><span>{student.guardianName || "Not provided"}</span><small>{student.guardianPhone || ""}</small></>,
              formatDate(student.dateOfBirth),
              <Link to={`/students/${student.id}`}>View</Link>,
            ])}
          />
        </Card>
      </section>
    </>
  );
}

function StudentDetail() {
  const { id } = useParams();
  const state = useApi(
    async () => ({
      details: await apiRequest(`/students/${id}?term=Term%201&academicYear=2026`),
      streams: await apiRequest("/streams"),
    }),
    [id],
    { details: null, streams: [] },
  );

  async function update(event) {
    try {
      await submitForm(event, `/students/${id}`, { method: "PUT", reset: false });
      state.setMessage("Student updated.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function remove() {
    try {
      await apiRequest(`/students/${id}`, { method: "DELETE" });
      window.location.href = "/students";
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function report() {
    const student = state.data.details.student;
    await downloadPdf(`/reports/students/${id}/pdf?term=Term%201&academicYear=2026`, `${student.admissionNo}-report-card.pdf`);
  }

  if (state.loading) return <Spinner />;
  if (!state.data.details) {
    return (
      <>
        <PageHeader eyebrow="Student profile" title="Student unavailable" description="The student record could not be loaded." />
        <Alert message={state.error} type="error" />
      </>
    );
  }
  const { student, stream, performance } = state.data.details;

  return (
    <>
      <PageHeader
        eyebrow="Student profile"
        title={fullName(student)}
        description="Edit profile details and download an individual report card."
        actions={<button className="btn primary" onClick={report}><Download size={16} />Report card</button>}
      />
      <Alert message={state.message} />
      <Alert message={state.error} type="error" />
      <section className="two-column">
        <Card title="Edit student">
          <form onSubmit={update} className="form-grid">
            <Field label="Admission no."><input name="admissionNo" defaultValue={student.admissionNo} required /></Field>
            <Field label="Class stream"><Select name="classStreamId" items={state.data.streams} defaultValue={student.classStreamId} required /></Field>
            <Field label="First name"><input name="firstName" defaultValue={student.firstName} required /></Field>
            <Field label="Last name"><input name="lastName" defaultValue={student.lastName} required /></Field>
            <Field label="Gender"><select name="gender" defaultValue={student.gender || ""}><option value="">Not specified</option><option>Female</option><option>Male</option></select></Field>
            <Field label="Date of birth"><input name="dateOfBirth" type="date" defaultValue={student.dateOfBirth?.slice(0, 10) || ""} /></Field>
            <Field label="Guardian"><input name="guardianName" defaultValue={student.guardianName || ""} /></Field>
            <Field label="Phone"><input name="guardianPhone" defaultValue={student.guardianPhone || ""} /></Field>
            <button className="btn primary"><Save size={16} />Save</button>
          </form>
          <button className="btn danger mt" onClick={remove}><Trash2 size={16} />Delete student</button>
        </Card>
        <Card title="Performance summary">
          <div className="stats-grid compact">
            <Stat label="Stream" value={stream.name} />
            <Stat label="Position" value={performance.overallPosition || "-"} />
            <Stat label="Average" value={formatScore(performance.averageScore)} />
            <Stat label="Grade" value={performance.grade} />
          </div>
        </Card>
      </section>
      <Card title="Subject performance">
        <Table
          headers={["Subject", "CAT", "Exam", "Total", "Grade", "Subject pos.", "Remarks"]}
          rows={performance.scores.map((score) => [
            score.subjectName,
            formatScore(score.catScore),
            formatScore(score.examScore),
            formatScore(score.totalScore),
            score.grade,
            score.subjectPosition,
            score.remarks || score.gradeRemark,
          ])}
        />
      </Card>
    </>
  );
}

function Subjects() {
  const state = useApi(
    async () => ({
      streams: await apiRequest("/streams"),
      subjects: await apiRequest("/subjects"),
    }),
    [],
    { streams: [], subjects: [] },
  );

  async function create(event) {
    try {
      await submitForm(event, "/subjects");
      state.setMessage("Subject created.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function update(event, id) {
    try {
      await submitForm(event, `/subjects/${id}`, { method: "PUT", reset: false });
      state.setMessage("Subject updated.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function remove(id) {
    try {
      await apiRequest(`/subjects/${id}`, { method: "DELETE" });
      state.setMessage("Subject deleted.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  if (state.loading) return <Spinner />;

  return (
    <>
      <PageHeader eyebrow="Subject management" title="Subjects" description="Create subjects and assign them to streams." />
      <Alert message={state.message} />
      <Alert message={state.error} type="error" />
      <section className="two-column">
        <Card title="Create subject">
          <form onSubmit={create} className="form-grid">
            <Field label="Code"><input name="code" required placeholder="MAT" /></Field>
            <Field label="Subject name"><input name="name" required placeholder="Mathematics" /></Field>
            <Field label="Teacher"><input name="teacherName" /></Field>
            <CheckboxGroup streams={state.data.streams} />
            <button className="btn primary"><Plus size={16} />Create subject</button>
          </form>
        </Card>
        <Card title="All subjects">
          <div className="stack">
            {state.data.subjects.map((subject) => (
              <form key={subject.id} className="subject-editor" onSubmit={(event) => update(event, subject.id)}>
                <div className="form-grid three">
                  <Field label="Code"><input name="code" defaultValue={subject.code} required /></Field>
                  <Field label="Name"><input name="name" defaultValue={subject.name} required /></Field>
                  <Field label="Teacher"><input name="teacherName" defaultValue={subject.teacherName || ""} /></Field>
                </div>
                <CheckboxGroup streams={state.data.streams} selected={subject.streams.map((stream) => stream.id)} />
                <div className="toolbar">
                  <button className="btn"><Save size={15} />Save</button>
                  <button type="button" className="btn danger" onClick={() => remove(subject.id)}><Trash2 size={15} />Delete</button>
                  <span className="pill">{subject.scoreCount} scores</span>
                </div>
              </form>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}

function Scores() {
  const [filters, setFilters] = useState({ streamId: "", subjectId: "", term: "Term 1", academicYear: "2026" });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const state = useApi(
    async () => ({
      streams: await apiRequest("/streams"),
      students: await apiRequest("/students"),
      subjects: await apiRequest("/subjects"),
      scores: await apiRequest("/scores"),
    }),
    [],
    { streams: [], students: [], subjects: [], scores: [] },
  );
  const [performance, setPerformance] = useState([]);

  async function create(event) {
    try {
      await submitForm(event, "/scores");
      setSelectedStudentId("");
      state.setMessage("Score recorded.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function update(event, id) {
    try {
      await submitForm(event, `/scores/${id}`, { method: "PUT", reset: false });
      state.setMessage("Score updated.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function remove(id) {
    try {
      await apiRequest(`/scores/${id}`, { method: "DELETE" });
      state.setMessage("Score deleted.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function loadPerformance(event) {
    event.preventDefault();
    try {
      const params = new URLSearchParams(filters);
      setPerformance(await apiRequest(`/scores/class-subject?${params}`));
    } catch (err) {
      state.setError(err.message);
    }
  }

  if (state.loading) return <Spinner />;

  const selectedStudent = state.data.students.find((student) => student.id === selectedStudentId);
  const subjectsForSelectedStudent = selectedStudent
    ? subjectsForStream(state.data.subjects, selectedStudent.classStreamId)
    : [];
  const subjectsForSelectedStream = filters.streamId
    ? subjectsForStream(state.data.subjects, filters.streamId)
    : state.data.subjects;

  return (
    <>
      <PageHeader eyebrow="Assessment scoring" title="Scores" description="Record CAT and exam marks, update score records, and view subject positions." />
      <Alert message={state.message} />
      <Alert message={state.error} type="error" />
      <section className="two-column">
        <Card title="Record score" subtitle="CAT max 30, exam max 100.">
          <form onSubmit={create} className="form-grid">
            <Field label="Student"><StudentSelect students={state.data.students} value={selectedStudentId} onChange={setSelectedStudentId} /></Field>
            <Field label="Subject"><SubjectSelect subjects={subjectsForSelectedStudent} disabled={!selectedStudentId} /></Field>
            <Field label="Term"><TermSelect /></Field>
            <Field label="Academic year"><input name="academicYear" type="number" defaultValue="2026" required /></Field>
            <Field label="CAT score"><input name="catScore" type="number" min="0" max="30" step="0.01" required /></Field>
            <Field label="Exam score"><input name="examScore" type="number" min="0" max="100" step="0.01" required /></Field>
            <Field label="Remarks"><textarea name="remarks" rows="3" /></Field>
            <button className="btn primary"><Plus size={16} />Record score</button>
          </form>
        </Card>
        <Card title="Class performance by subject">
          <form onSubmit={loadPerformance} className="form-grid">
            <Field label="Class stream"><Select value={filters.streamId} onChange={(value) => setFilters({ ...filters, streamId: value, subjectId: "" })} items={state.data.streams} /></Field>
            <Field label="Subject"><Select value={filters.subjectId} onChange={(value) => setFilters({ ...filters, subjectId: value })} items={subjectsForSelectedStream} labelKey="name" /></Field>
            <Field label="Term"><select value={filters.term} onChange={(event) => setFilters({ ...filters, term: event.target.value })}><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></Field>
            <Field label="Academic year"><input value={filters.academicYear} onChange={(event) => setFilters({ ...filters, academicYear: event.target.value })} /></Field>
            <button className="btn">View ranking</button>
          </form>
          <Table headers={["Pos.", "Student", "CAT", "Exam", "Total", "Grade"]} rows={performance.map((row) => [row.position, row.studentName, formatScore(row.catScore), formatScore(row.examScore), formatScore(row.totalScore), row.grade])} />
        </Card>
      </section>
      <Card title="Recent score records">
        <div className="stack">
          {state.data.scores.map((score) => (
            <form key={score.id} onSubmit={(event) => update(event, score.id)} className="score-editor">
              <input type="hidden" name="studentId" value={score.studentId} />
              <input type="hidden" name="subjectId" value={score.subjectId} />
              <input type="hidden" name="term" value={score.term} />
              <input type="hidden" name="academicYear" value={score.academicYear} />
              <strong>{score.firstName} {score.lastName} | {score.subjectName}</strong>
              <small>{score.classStreamName} | {score.term} {score.academicYear}</small>
              <input name="catScore" type="number" min="0" max="30" step="0.01" defaultValue={score.catScore} />
              <input name="examScore" type="number" min="0" max="100" step="0.01" defaultValue={score.examScore} />
              <input name="remarks" defaultValue={score.remarks || ""} />
              <b>{formatScore(score.totalScore)}</b>
              <button className="btn"><Save size={15} />Update</button>
              <button type="button" className="btn danger" onClick={() => remove(score.id)}><Trash2 size={15} />Delete</button>
            </form>
          ))}
        </div>
      </Card>
    </>
  );
}

function Grading() {
  const state = useApi(() => apiRequest("/grading"), [], []);

  async function create(event) {
    try {
      await submitForm(event, "/grading");
      state.setMessage("Grade boundary created.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function update(event, id) {
    try {
      await submitForm(event, `/grading/${id}`, { method: "PUT", reset: false });
      state.setMessage("Grade boundary updated.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  async function remove(id) {
    try {
      await apiRequest(`/grading/${id}`, { method: "DELETE" });
      state.setMessage("Grade boundary deleted.");
      state.reload();
    } catch (err) {
      state.setError(err.message);
    }
  }

  if (state.loading) return <Spinner />;

  return (
    <>
      <PageHeader eyebrow="Results processing" title="Grading scale" description="Configure grade boundaries used for averages and report cards." />
      <Alert message={state.message} />
      <Alert message={state.error} type="error" />
      <section className="two-column grading-layout">
        <Card title="Add grade band">
          <form onSubmit={create} className="form-grid">
            <Field label="Label"><input name="label" required placeholder="A" /></Field>
            <Field label="Min score"><input name="minScore" type="number" required /></Field>
            <Field label="Max score"><input name="maxScore" type="number" required /></Field>
            <Field label="Points"><input name="points" type="number" required /></Field>
            <Field label="Sort order"><input name="sortOrder" type="number" required /></Field>
            <Field label="Remark"><input name="remark" /></Field>
            <button className="btn primary"><Plus size={16} />Add grade</button>
          </form>
        </Card>
        <Card title="Configured grade bands">
          <div className="stack">
            {state.data.map((grade) => (
              <form key={grade.id} onSubmit={(event) => update(event, grade.id)} className="grade-editor">
                <Field label="Label"><input name="label" defaultValue={grade.label} required /></Field>
                <Field label="Min"><input name="minScore" type="number" defaultValue={grade.minScore} required /></Field>
                <Field label="Max"><input name="maxScore" type="number" defaultValue={grade.maxScore} required /></Field>
                <Field label="Points"><input name="points" type="number" defaultValue={grade.points} required /></Field>
                <Field label="Order"><input name="sortOrder" type="number" defaultValue={grade.sortOrder} required /></Field>
                <Field label="Remark"><input name="remark" defaultValue={grade.remark || ""} /></Field>
                <div className="grade-actions">
                  <button className="btn"><Save size={15} />Save</button>
                  <button type="button" className="btn danger" onClick={() => remove(grade.id)}><Trash2 size={15} />Delete</button>
                </div>
              </form>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}

function Reports() {
  const state = useApi(() => apiRequest("/streams"), [], []);
  const [filters, setFilters] = useState({ streamId: "", term: "Term 1", academicYear: "2026" });
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (state.data?.[0] && !filters.streamId) {
      setFilters((current) => ({ ...current, streamId: state.data[0].id }));
    }
  }, [state.data, filters.streamId]);

  async function prepare(event) {
    event.preventDefault();
    const params = new URLSearchParams(filters);
    setReport(await apiRequest(`/reports/class?${params}`));
  }

  async function classPdf() {
    const params = new URLSearchParams(filters);
    await downloadPdf(`/reports/class/pdf?${params}`, "class-performance-report.pdf");
  }

  async function studentPdf(student) {
    await downloadPdf(`/reports/students/${student.id}/pdf?term=${filters.term}&academicYear=${filters.academicYear}`, `${student.admissionNo}-report-card.pdf`);
  }

  if (state.loading) return <Spinner />;

  return (
    <>
      <PageHeader eyebrow="Reporting" title="PDF reports" description="Generate backend PDF report cards and class performance reports." actions={report && <button className="btn primary" onClick={classPdf}><Download size={16} />Class PDF</button>} />
      <Card title="Prepare report">
        <form onSubmit={prepare} className="report-filters">
          <Select value={filters.streamId} onChange={(value) => setFilters({ ...filters, streamId: value })} items={state.data} />
          <select value={filters.term} onChange={(event) => setFilters({ ...filters, term: event.target.value })}><option>Term 1</option><option>Term 2</option><option>Term 3</option></select>
          <input value={filters.academicYear} onChange={(event) => setFilters({ ...filters, academicYear: event.target.value })} />
          <button className="btn">Prepare</button>
        </form>
      </Card>
      {report ? (
        <Card title={`${report.stream.name} | ${report.term} ${report.academicYear}`} subtitle={`${report.performance.length} students prepared.`}>
          <Table
            headers={["Pos.", "Student", "Subjects", "Total", "Average", "Grade", "PDF"]}
            rows={report.performance.map((student) => [
              student.overallPosition,
              <Link to={`/students/${student.id}`}>{student.firstName} {student.lastName}<small>{student.admissionNo}</small></Link>,
              student.scores.length,
              formatScore(student.totalMarks),
              formatScore(student.averageScore),
              student.grade,
              <button className="btn small" onClick={() => studentPdf(student)}><Download size={14} />PDF</button>,
            ])}
          />
        </Card>
      ) : (
        <EmptyState title="No report prepared" description="Choose a stream and term, then prepare report data." />
      )}
    </>
  );
}

function Card({ title, subtitle, children }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Table({ headers, rows }) {
  if (!rows?.length) return <EmptyState title="No records found" description="Add records or change the current filters." />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Select({ name, items, defaultValue = "", value, onChange, required, labelKey = "name" }) {
  return (
    <select name={name} defaultValue={value === undefined ? defaultValue : undefined} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} required={required}>
      <option value="">Select option</option>
      {items.map((item) => <option key={item.id} value={item.id}>{item[labelKey] || item.name}</option>)}
    </select>
  );
}

function StudentSelect({ students, value, onChange }) {
  return (
    <select name="studentId" required defaultValue={value === undefined ? "" : undefined} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined}>
      <option value="" disabled>Select student</option>
      {students.map((student) => <option key={student.id} value={student.id}>{student.admissionNo} - {fullName(student)} ({student.classStreamName})</option>)}
    </select>
  );
}

function SubjectSelect({ subjects, disabled = false }) {
  return (
    <select name="subjectId" required defaultValue="" disabled={disabled}>
      <option value="" disabled>{disabled ? "Select a student first" : "Select subject"}</option>
      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code} - {subject.name}</option>)}
    </select>
  );
}

function subjectsForStream(subjects, streamId) {
  return subjects.filter((subject) =>
    subject.streams?.some((stream) => stream.id === streamId),
  );
}

function TermSelect() {
  return (
    <select name="term" defaultValue="Term 1">
      <option>Term 1</option>
      <option>Term 2</option>
      <option>Term 3</option>
    </select>
  );
}

function CheckboxGroup({ streams, selected = [] }) {
  return (
    <fieldset className="checkbox-grid">
      <legend>Assign to streams</legend>
      {streams.map((stream) => (
        <label key={stream.id}>
          <input type="checkbox" name="streamIds" value={stream.id} defaultChecked={selected.includes(stream.id)} />
          {stream.name}
        </label>
      ))}
    </fieldset>
  );
}
