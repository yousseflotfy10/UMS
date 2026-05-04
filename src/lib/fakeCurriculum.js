const DEFAULT_COURSES = [
  { id: 1, name: "Software Engineering", code: "SE301", department: "Computer Science", level: "3", credits: 3 },
  { id: 2, name: "Database Systems", code: "DB201", department: "Computer Science", level: "2", credits: 3 },
  { id: 3, name: "Distributed Systems", code: "DS401", department: "Computer Science", level: "4", credits: 3 },
];

export function getCourses() {
  const stored = localStorage.getItem("courses");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("courses", JSON.stringify(DEFAULT_COURSES));
  return DEFAULT_COURSES;
}

export function getRegistrations(studentEmail) {
  const stored = localStorage.getItem("registrations");
  const registrations = stored ? JSON.parse(stored) : [];
  return registrations.filter((item) => item.studentEmail === studentEmail);
}

export function registerCourse(studentEmail, courseId) {
  const course = getCourses().find((item) => item.id === Number(courseId));
  if (!course) return { success: false, message: "Course not found." };

  const stored = localStorage.getItem("registrations");
  const registrations = stored ? JSON.parse(stored) : [];

  const exists = registrations.find(
    (item) => item.studentEmail === studentEmail && item.courseId === course.id
  );

  if (exists) return { success: false, message: "You are already registered in this course." };

  registrations.push({
    id: Date.now(),
    studentEmail,
    courseId: course.id,
    courseName: course.name,
    courseCode: course.code,
    department: course.department,
    level: course.level,
    credits: course.credits,
    date: new Date().toLocaleString(),
  });

  localStorage.setItem("registrations", JSON.stringify(registrations));
  return { success: true, message: "Course registered successfully." };
}

export function dropCourse(studentEmail, courseId) {
  const stored = localStorage.getItem("registrations");
  const registrations = stored ? JSON.parse(stored) : [];
  const updated = registrations.filter(
    (item) => !(item.studentEmail === studentEmail && item.courseId === Number(courseId))
  );
  localStorage.setItem("registrations", JSON.stringify(updated));
  return { success: true, message: "Course removed from registrations." };
}
