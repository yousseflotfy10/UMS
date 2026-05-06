const DEFAULT_GRADES = [
  {
    id: 1,
    studentName: "Jana Tamer",
    studentEmail: "jana@student.com",
    courseCode: "SE301",
    courseName: "Software Engineering",
    grade: "A",
    feedback: "Excellent work",
    date: "2026-05-06",
  },
];

export function getGrades() {
  const stored = localStorage.getItem("grades");

  if (stored) {
    return JSON.parse(stored);
  }

  localStorage.setItem("grades", JSON.stringify(DEFAULT_GRADES));
  return DEFAULT_GRADES;
}

export function uploadGrade(gradeData) {
  const grades = getGrades();

  const existingGrade = grades.find(
    (item) =>
      item.studentEmail === gradeData.studentEmail &&
      item.courseCode === gradeData.courseCode
  );

  if (existingGrade) {
    return {
      success: false,
      message: "Grade already uploaded for this student in this course.",
    };
  }

  const newGrade = {
    id: Date.now(),
    ...gradeData,
    date: new Date().toLocaleString(),
  };

  grades.push(newGrade);
  localStorage.setItem("grades", JSON.stringify(grades));

  return {
    success: true,
    message: "Grade uploaded successfully.",
  };
}
