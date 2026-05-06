const DEFAULT_COURSES = [
  { id: 1, code: "CSE233", name: "Agile Software Engineering" },
  { id: 2, code: "CSE323", name: "Advanced Embedded Systems" },
  { id: 3, code: "CSE354", name: "Distributed Computing" },
];

const DEFAULT_STUDENTS = [
  { id: 1, name: "Jana Tamer", email: "jana@student.com" },
  { id: 2, name: "Ali Ibrahim", email: "ali@student.com" },
  { id: 3, name: "Youssef Lotfy", email: "youssef@student.com" },
];

const DEFAULT_GRADES = [
  {
    id: 1,
    studentName: "Jana Tamer",
    studentEmail: "jana@student.com",
    courseCode: "CSE233",
    courseName: "Agile Software Engineering",
    grade: "A",
    feedback: "Excellent work",
    date: "2026-05-06",
  },
];

export function getCourses() {
  return DEFAULT_COURSES;
}

export function getStudents() {
  return DEFAULT_STUDENTS;
}

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
    date: new Date().toISOString().split("T")[0],
  };

  grades.push(newGrade);
  localStorage.setItem("grades", JSON.stringify(grades));

  return {
    success: true,
    message: "Grade uploaded successfully.",
  };
}