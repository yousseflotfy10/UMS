"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import {
  getAllRegistrations,
  getProfessorRegistrations,
  getRegistrationStats,
} from "../../lib/community";
import { getGrades, getGradesForCourses, uploadGrade } from "../../lib/grades";

export default function UploadGradesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [grades, setGrades] = useState([]);

  const [studentEmail, setStudentEmail] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || !["admin", "professor", "doctor"].includes(currentUser.role)) {
        router.push("/signin");
        return;
      }

      const visibleCourses = await getRegistrationStats(
        ["professor", "doctor"].includes(currentUser.role) ? currentUser.name : ""
      );
      const visibleRegistrations =
        ["professor", "doctor"].includes(currentUser.role)
          ? await getProfessorRegistrations(currentUser.name)
          : await getAllRegistrations();

      setUser(currentUser);
      setCourses(visibleCourses);
      setRegistrations(visibleRegistrations);
      setGrades(
        ["professor", "doctor"].includes(currentUser.role)
          ? await getGradesForCourses(visibleCourses.map((course) => course.code))
          : await getGrades()
      );
      setCourseCode(visibleCourses[0]?.code || "");
    }
    init();
  }, [router]);

  const studentsForSelectedCourse = useMemo(() => {
    if (!courseCode) return [];

    return registrations.filter(
      (registration) => registration.courseCode === courseCode
    );
  }, [registrations, courseCode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!studentEmail || !courseCode || !grade.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    const selectedStudent = registrations.find(
      (registration) =>
        registration.studentEmail === studentEmail &&
        registration.courseCode === courseCode
    );

    if (!selectedStudent) {
      setMessage("This student is not registered in the selected course.");
      return;
    }

    const result = await uploadGrade({
      studentName: selectedStudent.studentName || "Student",
      studentEmail: selectedStudent.studentEmail,
      courseCode: selectedStudent.courseCode,
      courseName: selectedStudent.courseName,
      grade: grade.trim(),
      feedback: feedback.trim(),
      uploadedBy: user?.id,
    });

    setMessage(result.message);

    if (result.success) {
      setGrades(
        ["professor", "doctor"].includes(user?.role)
          ? await getGradesForCourses(courses.map((course) => course.code))
          : await getGrades()
      );
      setStudentEmail("");
      setGrade("");
      setFeedback("");
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Upload Grades</h2>
        <p>
          Doctor can upload grades only for students registered in the selected
          course.
        </p>

        <hr />

        {registrations.length === 0 && (
          <div className="message">
            No registered students yet. Students must register in courses first.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <select
            className="form-select"
            value={courseCode}
            onChange={(e) => {
              setCourseCode(e.target.value);
              setStudentEmail("");
            }}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.code}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          >
            <option value="">Select registered student</option>
            {studentsForSelectedCourse.map((student) => (
              <option key={student.id} value={student.studentEmail}>
                {student.studentName || "Student"} - {student.studentEmail}
              </option>
            ))}
          </select>

          <input
            className="form-input"
            placeholder="Grade, example: A, B+, 95"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />

          <textarea
            className="form-textarea"
            placeholder="Feedback optional"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button className="primary-btn">Upload Grade</button>
        </form>

        {message && (
          <div
            className={
              message.includes("successfully") ? "message success" : "message"
            }
          >
            {message}
          </div>
        )}

        <hr />

        <h3>Uploaded Grades</h3>

        {grades.length === 0 && <p>No grades uploaded yet.</p>}

        {grades.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>
              {item.studentName} - {item.courseCode}
            </h3>
            <p>
              <strong>Course:</strong> {item.courseName}
            </p>
            <p>
              <strong>Grade:</strong> {item.grade}
            </p>
            <p>
              <strong>Feedback:</strong> {item.feedback || "No feedback"}
            </p>
            {item.uploadedBy && (
              <p>
                <strong>Uploaded by:</strong> {item.uploadedBy}
              </p>
            )}
            <p className="meta">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
