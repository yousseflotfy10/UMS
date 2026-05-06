"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import { getCourses, addCourse } from "../../lib/fakeCurriculum";

export default function AddCoursesPage() {
  const [courses, setCourses] = useState([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [credits, setCredits] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCourses(getCourses());
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!name.trim() || !code.trim() || !department.trim() || !level.trim() || !credits.trim()) {
      setMessage("Please fill all fields.");
      return;
    }

    const result = addCourse({
      name: name.trim(),
      code: code.trim(),
      department: department.trim(),
      level: level.trim(),
      credits: Number(credits),
    });

    setMessage(result.message);

    if (result.success) {
      setCourses(getCourses());
      setName("");
      setCode("");
      setDepartment("");
      setLevel("");
      setCredits("");
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Add Courses</h2>
        <p>Admin can add new courses to the university course list.</p>

        <hr />

        <form onSubmit={handleSubmit}>
          <input
            className="form-input"
            placeholder="Course Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <input
            className="form-input"
            placeholder="Course Code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />

          <input
            className="form-input"
            placeholder="Department"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
          />

          <input
            className="form-input"
            placeholder="Level"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          />

          <input
            className="form-input"
            type="number"
            placeholder="Credits"
            value={credits}
            onChange={(event) => setCredits(event.target.value)}
          />

          <button className="primary-btn">Add Course</button>
        </form>

        {message && (
          <div className={message.includes("successfully") ? "message success" : "message"}>
            {message}
          </div>
        )}

        <hr />

        <h3>Current Courses</h3>

        {courses.map((course) => (
          <div className="info-card" key={course.id}>
            <h3>{course.code} - {course.name}</h3>
            <p><strong>Department:</strong> {course.department}</p>
            <p><strong>Level:</strong> {course.level}</p>
            <p><strong>Credits:</strong> {course.credits}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}