const DEFAULT_COURSES = [
  {
    id: 1,
    name: "Software Engineering",
    code: "SE301",
    department: "Computer Science",
    level: "3",
    credits: 3,
    professor: "Prof. Ahmed Hassan",
  },
  {
    id: 2,
    name: "Database Systems",
    code: "DB201",
    department: "Computer Science",
    level: "2",
    credits: 3,
    professor: "Prof. Mona Adel",
  },
  {
    id: 3,
    name: "Distributed Systems",
    code: "DS401",
    department: "Computer Science",
    level: "4",
    credits: 3,
    professor: "Prof. Karim Samir",
  },
];

function getStudentEmail(student) {
  return typeof student === "string" ? student : student?.email;
}

function getStudentName(student) {
  return typeof student === "string" ? "Student" : student?.name || "Student";
}

export function getCourses() {
  const stored = localStorage.getItem("courses");

  if (stored) {
    const courses = JSON.parse(stored);
    const migratedCourses = courses.map((course) => {
      const defaultCourse = DEFAULT_COURSES.find(
        (item) => item.code === course.code
      );

      return {
        ...course,
        professor: course.professor || defaultCourse?.professor || "Not assigned",
      };
    });

    localStorage.setItem("courses", JSON.stringify(migratedCourses));
    return migratedCourses;
  }

  localStorage.setItem("courses", JSON.stringify(DEFAULT_COURSES));
  return DEFAULT_COURSES;
}

export function getCourseById(courseId) {
  return getCourses().find((course) => course.id === Number(courseId));
}

export function getAllRegistrations() {
  const stored = localStorage.getItem("registrations");
  return stored ? JSON.parse(stored) : [];
}

export function getRegistrations(studentEmail) {
  return getAllRegistrations().filter(
    (item) => item.studentEmail === studentEmail
  );
}

export function getRegistrationsByCourse(courseId) {
  return getAllRegistrations().filter(
    (item) => item.courseId === Number(courseId)
  );
}

export function getProfessorRegistrations(professorName) {
  const courses = getCourses().filter((course) => course.professor === professorName);
  const professorCourseIds = courses.map((course) => Number(course.id));

  return getAllRegistrations().filter((registration) =>
    professorCourseIds.includes(Number(registration.courseId))
  );
}

export function getRegistrationStats(professorName = "") {
  const courses = getCourses().filter(
    (course) => !professorName || course.professor === professorName
  );
  const registrations = professorName
    ? getProfessorRegistrations(professorName)
    : getAllRegistrations();

  return courses.map((course) => ({
    ...course,
    registeredCount: registrations.filter(
      (item) => Number(item.courseId) === Number(course.id)
    ).length,
  }));
}

export function registerCourse(student, courseId) {
  const studentEmail = getStudentEmail(student);
  const studentName = getStudentName(student);
  const course = getCourseById(courseId);

  if (!studentEmail) {
    return { success: false, message: "Student account was not found." };
  }

  if (!course) {
    return { success: false, message: "Course not found." };
  }

  const registrations = getAllRegistrations();
  const exists = registrations.find(
    (item) => item.studentEmail === studentEmail && item.courseId === course.id
  );

  if (exists) {
    return {
      success: false,
      message: "You are already registered in this course.",
    };
  }

  registrations.push({
    id: Date.now(),
    studentEmail,
    studentName,
    courseId: course.id,
    courseName: course.name,
    courseCode: course.code,
    department: course.department,
    level: course.level,
    credits: course.credits,
    professor: course.professor || "Not assigned",
    date: new Date().toLocaleString(),
  });

  localStorage.setItem("registrations", JSON.stringify(registrations));

  return { success: true, message: "Course registered successfully." };
}

export function dropCourse(student, courseId) {
  const studentEmail = getStudentEmail(student);
  const updated = getAllRegistrations().filter(
    (item) =>
      !(item.studentEmail === studentEmail && item.courseId === Number(courseId))
  );

  localStorage.setItem("registrations", JSON.stringify(updated));

  return { success: true, message: "Course removed from registrations." };
}

export function addCourse(course) {
  const courses = getCourses();
  const exists = courses.find(
    (item) => item.code.toLowerCase() === course.code.toLowerCase()
  );

  if (exists) {
    return {
      success: false,
      message: "Course with this code already exists.",
    };
  }

  const newCourse = {
    id: Date.now(),
    name: course.name.trim(),
    code: course.code.trim(),
    department: course.department.trim(),
    level: course.level.trim(),
    credits: Number(course.credits),
    professor: course.professor || "Not assigned",
  };

  courses.push(newCourse);
  localStorage.setItem("courses", JSON.stringify(courses));

  return {
    success: true,
    message: "Course added successfully.",
  };
}
