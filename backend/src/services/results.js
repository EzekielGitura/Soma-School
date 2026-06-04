export function roundScore(value) {
  return Number(`${Math.round(`${Number(value)}e2`)}e-2`);
}

export function gradeForScore(score, gradeBands) {
  const grade = [...gradeBands]
    .sort((a, b) => Number(b.minScore) - Number(a.minScore))
    .find(
      (band) =>
        Number(score) >= Number(band.minScore) &&
        Number(score) <= Number(band.maxScore),
    );

  return {
    label: grade?.label || "N/A",
    remark: grade?.remark || "No grade configured",
    points: grade?.points || 0,
  };
}

export function rankByScore(items, scoreFor) {
  const sorted = [...items].sort((a, b) => scoreFor(b) - scoreFor(a));
  let previousScore = null;
  let previousPosition = 0;

  return sorted.map((item, index) => {
    const score = scoreFor(item);
    if (previousScore === null || score !== previousScore) {
      previousScore = score;
      previousPosition = index + 1;
    }

    return { ...item, position: previousPosition };
  });
}

export function buildClassPerformance(students, scores, gradeBands) {
  const scoresByStudent = new Map();
  const scoresBySubject = new Map();

  for (const score of scores) {
    const studentScores = scoresByStudent.get(score.studentId) || [];
    studentScores.push(score);
    scoresByStudent.set(score.studentId, studentScores);

    const subjectScores = scoresBySubject.get(score.subjectId) || [];
    subjectScores.push(score);
    scoresBySubject.set(score.subjectId, subjectScores);
  }

  const subjectPositions = new Map();
  for (const subjectScores of scoresBySubject.values()) {
    for (const rankedScore of rankByScore(subjectScores, (score) => score.totalScore)) {
      subjectPositions.set(rankedScore.id, rankedScore.position);
    }
  }

  const rows = students.map((student) => {
    const studentScores = scoresByStudent.get(student.id) || [];
    const totalMarks = roundScore(
      studentScores.reduce((total, score) => total + Number(score.totalScore), 0),
    );
    const averageScore = studentScores.length
      ? roundScore(totalMarks / studentScores.length)
      : 0;
    const grade = gradeForScore(averageScore, gradeBands);

    return {
      ...student,
      totalMarks,
      averageScore,
      grade: grade.label,
      gradeRemark: grade.remark,
      overallPosition: 0,
      scores: studentScores
        .map((score) => {
          const subjectGrade = gradeForScore(score.totalScore, gradeBands);

          return {
            ...score,
            grade: subjectGrade.label,
            gradeRemark: subjectGrade.remark,
            subjectPosition: subjectPositions.get(score.id) || 0,
          };
        })
        .sort((a, b) => a.subjectName.localeCompare(b.subjectName)),
    };
  });

  return rankByScore(rows, (row) => row.averageScore)
    .map((row) => ({ ...row, overallPosition: row.position }))
    .sort((a, b) => a.overallPosition - b.overallPosition);
}
