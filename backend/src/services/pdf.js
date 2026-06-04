import PDFDocument from "pdfkit";

function formatScore(value) {
  return Number(value).toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

function startDocument(res, fileName) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  const doc = new PDFDocument({ margin: 42, size: "A4" });
  doc.pipe(res);
  return doc;
}

function header(doc, title, subtitle) {
  doc.font("Helvetica-Bold").fontSize(18).text("Soma School");
  doc.moveDown(0.2);
  doc.fontSize(13).text(title);
  doc.moveDown(0.2);
  doc.font("Helvetica").fontSize(10).fillColor("#555555").text(subtitle);
  doc.fillColor("#111111").moveDown(1.2);
}

function row(doc, values, widths, options = {}) {
  const y = doc.y;
  let x = doc.x;
  const height = options.height || 22;

  if (options.header) {
    doc.rect(x, y, widths.reduce((sum, width) => sum + width, 0), height).fill("#047857");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8);
  } else {
    doc.fillColor("#111111").font("Helvetica").fontSize(8);
  }

  values.forEach((value, index) => {
    doc.text(String(value ?? ""), x + 4, y + 6, {
      width: widths[index] - 8,
      height: height - 4,
      ellipsis: true,
    });
    x += widths[index];
  });

  doc.y = y + height;
  doc.fillColor("#111111");
}

export function sendClassReportPdf(res, { stream, term, academicYear, performance }) {
  const safeName = stream.name.replace(/\s+/g, "-").toLowerCase();
  const doc = startDocument(res, `${safeName}-${term}-${academicYear}-class-report.pdf`);

  header(doc, "Class Performance Report", `${stream.name} | ${term} ${academicYear}`);

  const widths = [34, 72, 124, 52, 58, 58, 54, 100];
  row(doc, ["Pos", "Adm No.", "Student", "Subj", "Total", "Average", "Grade", "Comment"], widths, {
    header: true,
  });

  for (const student of performance) {
    row(doc, [
      student.overallPosition,
      student.admissionNo,
      `${student.firstName} ${student.lastName}`,
      student.scores.length,
      formatScore(student.totalMarks),
      formatScore(student.averageScore),
      student.grade,
      student.gradeRemark,
    ], widths);
  }

  doc.end();
}

export function sendStudentReportPdf(res, { student, stream, term, academicYear, performance }) {
  const doc = startDocument(res, `${student.admissionNo}-report-card.pdf`);

  header(doc, "Student Report Card", `${stream.name} | ${term} ${academicYear}`);

  doc.font("Helvetica-Bold").fontSize(11).text(`${student.firstName} ${student.lastName}`);
  doc.font("Helvetica").fontSize(10);
  doc.text(`Admission No: ${student.admissionNo}`);
  doc.text(`Overall Position: ${performance.overallPosition || "-"}`);
  doc.text(`Total Marks: ${formatScore(performance.totalMarks)}`);
  doc.text(`Average: ${formatScore(performance.averageScore)} (${performance.grade})`);
  doc.moveDown(1);

  const widths = [130, 46, 46, 52, 44, 64, 128];
  row(doc, ["Subject", "CAT", "Exam", "Total", "Grade", "Pos", "Remarks"], widths, {
    header: true,
  });

  for (const score of performance.scores) {
    row(doc, [
      `${score.subjectCode} - ${score.subjectName}`,
      formatScore(score.catScore),
      formatScore(score.examScore),
      formatScore(score.totalScore),
      score.grade,
      score.subjectPosition,
      score.remarks || score.gradeRemark,
    ], widths);
  }

  doc.moveDown(1);
  doc.font("Helvetica-Bold").fontSize(10).text("Class Teacher Comment");
  doc.font("Helvetica").text(performance.gradeRemark);

  doc.end();
}
