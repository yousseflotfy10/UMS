"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import { getUsers } from "../../lib/fakeAuth";
import {
  getCourses,
  getGrades,
  uploadGrade,
} from "../../lib/fakeGrades";

export default function UploadGradesPage() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);

  const [studentEmail, setStudentEmail] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCourses(getCourses());

    const users = getUsers();
    const studentUsers = users.filter((user) => user.role === "student");
    setStudents(studentUsers);

    setGrades(getGrades());
}, []);

  function handleSubmit(e) {
    e.preventDefault();

    if (!studentEmail || !courseCode || !grade) {
      setMessage("Please fill all required fields.");
      return;
    }

    const selectedStudent = students.find(
      (student) => student.email === studentEmail
    );

    const selectedCourse = courses.find(
      (course) => course.code === courseCode
    );

    const result = uploadGrade({
      studentName: selectedStudent.name,
      studentEmail: selectedStudent.email,
      courseCode: selectedCourse.code,
      courseName: selectedCourse.name,
      grade,
      feedback,
    });

    setMessage(result.message);

    if (result.success) {
      setGrades(getGrades());
      setStudentEmail("");
      setCourseCode("");
      setGrade("");
      setFeedback("");
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Upload Grades</h2>
        <p>
          Professor can upload student grades so students can access their
          results.
        </p>

        <hr />

        <form onSubmit={handleSubmit}>
          <select
            className="form-select"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          >
            <option value="">Select student</option>
            {students.map((student) => (
            <option key={student.email} value={student.email}>
             {student.name} - {student.email}
            </option>
            ))}
          </select>

          <select
            className="form-select"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.code}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            <option value="">Select grade</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B+">B+</option>
            <option value="B">B</option>
            <option value="C+">C+</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="F">F</option>
          </select>

          <textarea
            className="form-textarea"
            placeholder="Feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />

          <button className="primary-btn" type="submit">
            Upload Grade
          </button>
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

        {grades.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>{item.studentName}</h3>
            <p>
              <strong>Course:</strong> {item.courseCode} - {item.courseName}
            </p>
            <p>
              <strong>Grade:</strong> {item.grade}
            </p>
            <p>
              <strong>Feedback:</strong> {item.feedback || "No feedback"}
            </p>
            <p className="meta">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}