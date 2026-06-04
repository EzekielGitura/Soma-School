import { query } from "../db/pool.js";
import { buildClassPerformance, gradeForScore, rankByScore } from "./results.js";

export async function getGradeBands() {
  const { rows } = await query(`
    SELECT
      id,
      label,
      min_score AS "minScore",
      max_score AS "maxScore",
      points,
      remark,
      sort_order AS "sortOrder"
    FROM grade_boundaries
    ORDER BY sort_order ASC
  `);

  return rows.map(numberGrade);
}

export async function getClassPerformance(classStreamId, filters = {}) {
  const streamResult = await query(
    `
      SELECT
        id,
        name,
        teacher_name AS "teacherName",
        academic_year AS "academicYear",
        capacity
      FROM class_streams
      WHERE id = $1
    `,
    [classStreamId],
  );
  const stream = streamResult.rows[0];

  if (!stream) return null;

  const students = await getStudentsForStream(classStreamId);
  const gradeBands = await getGradeBands();
  const scores = students.length
    ? await getScoresForStudents(
        students.map((student) => student.id),
        filters,
      )
    : [];

  return {
    stream,
    students,
    scores,
    performance: buildClassPerformance(students, scores, gradeBands),
  };
}

export async function getStudentPerformance(studentId, filters = {}) {
  const studentResult = await query(
    `
      SELECT
        s.id,
        s.admission_no AS "admissionNo",
        s.first_name AS "firstName",
        s.last_name AS "lastName",
        s.gender,
        s.date_of_birth AS "dateOfBirth",
        s.guardian_name AS "guardianName",
        s.guardian_phone AS "guardianPhone",
        s.class_stream_id AS "classStreamId",
        cs.name AS "classStreamName",
        cs.academic_year AS "streamAcademicYear"
      FROM students s
      JOIN class_streams cs ON cs.id = s.class_stream_id
      WHERE s.id = $1
    `,
    [studentId],
  );
  const student = studentResult.rows[0];

  if (!student) return null;

  const classData = await getClassPerformance(student.classStreamId, filters);
  const performance = classData.performance.find((row) => row.id === student.id);

  return {
    student,
    stream: classData.stream,
    performance:
      performance ||
      {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        totalMarks: 0,
        averageScore: 0,
        grade: "N/A",
        gradeRemark: "No scores recorded",
        overallPosition: 0,
        scores: [],
      },
  };
}

export async function getClassSubjectPerformance({
  classStreamId,
  subjectId,
  term,
  academicYear,
}) {
  const students = await getStudentsForStream(classStreamId);
  const gradeBands = await getGradeBands();
  const { rows: scores } = await query(
    `
      SELECT
        id,
        student_id AS "studentId",
        cat_score AS "catScore",
        exam_score AS "examScore",
        total_score AS "totalScore"
      FROM assessment_scores
      WHERE subject_id = $1
        AND term = $2
        AND academic_year = $3
        AND student_id = ANY($4::uuid[])
    `,
    [subjectId, term, academicYear, students.map((student) => student.id)],
  );

  const scoreByStudent = new Map(scores.map((score) => [score.studentId, score]));
  const rows = students
    .map((student) => {
      const score = scoreByStudent.get(student.id);
      const totalScore = Number(score?.totalScore || 0);
      const grade = score ? gradeForScore(totalScore, gradeBands).label : "N/A";

      return {
        studentId: student.id,
        admissionNo: student.admissionNo,
        studentName: `${student.firstName} ${student.lastName}`,
        catScore: Number(score?.catScore || 0),
        examScore: Number(score?.examScore || 0),
        totalScore,
        grade,
        hasScore: Boolean(score),
      };
    })
    .filter((row) => row.hasScore);

  return rankByScore(rows, (row) => row.totalScore).map((row) => ({
    ...row,
    position: row.position,
  }));
}

async function getStudentsForStream(classStreamId) {
  const { rows } = await query(
    `
      SELECT
        id,
        admission_no AS "admissionNo",
        first_name AS "firstName",
        last_name AS "lastName"
      FROM students
      WHERE class_stream_id = $1
      ORDER BY last_name ASC, first_name ASC
    `,
    [classStreamId],
  );

  return rows;
}

async function getScoresForStudents(studentIds, filters) {
  const params = [studentIds];
  const conditions = ["student_id = ANY($1::uuid[])"];

  if (filters.term) {
    params.push(filters.term);
    conditions.push(`term = $${params.length}`);
  }

  if (filters.academicYear) {
    params.push(Number(filters.academicYear));
    conditions.push(`academic_year = $${params.length}`);
  }

  const { rows } = await query(
    `
      SELECT
        a.id,
        a.student_id AS "studentId",
        a.subject_id AS "subjectId",
        sub.code AS "subjectCode",
        sub.name AS "subjectName",
        a.cat_score AS "catScore",
        a.exam_score AS "examScore",
        a.total_score AS "totalScore",
        a.remarks
      FROM assessment_scores a
      JOIN subjects sub ON sub.id = a.subject_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY sub.name ASC
    `,
    params,
  );

  return rows.map(numberScore);
}

function numberScore(score) {
  return {
    ...score,
    catScore: Number(score.catScore),
    examScore: Number(score.examScore),
    totalScore: Number(score.totalScore),
  };
}

function numberGrade(grade) {
  return {
    ...grade,
    minScore: Number(grade.minScore),
    maxScore: Number(grade.maxScore),
  };
}
