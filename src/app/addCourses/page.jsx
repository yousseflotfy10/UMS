"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser, getProfessors } from "../../lib/auth";
import { getCourses, addCourse } from "../../lib/community";

export default function AddCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [credits, setCredits] = useState("");
  const [professor, setProfessor] = useState("");
  const [prerequisiteCodes, setPrerequisiteCodes] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || currentUser.role !== "admin") {
        router.push("/signin");
        return;
      }

      const professorUsers = await getProfessors();
      setCourses(await getCourses());
      setProfessors(professorUsers);
      setProfessor(professorUsers[0]?.name || "");
    }

    init();
  }, [router]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (
      !name.trim() ||
      !code.trim() ||
      !department.trim() ||
      !level.trim() ||
      !credits.trim() ||
      !professor
    ) {
      setMessage("Please fill all fields.");
      return;
    }

    const result = await addCourse({
      name,
      code,
      department,
      level,
      credits,
      professor,
      prerequisiteCodes,
      scheduleDay,
      scheduleTimeSlot,
    });

    setMessage(result.message);

    if (result.success) {
      setCourses(await getCourses());
      setName("");
      setCode("");
      setDepartment("");
      setLevel("");
      setCredits("");
      setPrerequisiteCodes("");
      setScheduleDay("");
      setScheduleTimeSlot("");
      setProfessor(professors[0]?.name || "");
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Add Courses</h2>
        <p>Admin can add new courses and assign each course to a doctor.</p>

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

          <select
            className="form-select"
            value={professor}
            onChange={(event) => setProfessor(event.target.value)}
          >
            {professors.map((prof) => (
              <option key={prof.email} value={prof.name}>
                {prof.name}
              </option>
            ))}
          </select>

          <input
            className="form-input"
            placeholder="Prerequisite course codes, optional: CS101, MATH101"
            value={prerequisiteCodes}
            onChange={(event) => setPrerequisiteCodes(event.target.value)}
          />

          <div className="inline-grid">
            <label className="field-label">
              Schedule Day Optional
              <select
                className="form-select"
                value={scheduleDay}
                onChange={(event) => setScheduleDay(event.target.value)}
              >
                <option value="">No fixed day</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </label>

            <label className="field-label">
              Schedule Time Slot Optional
              <input
                className="form-input"
                placeholder="Example: 10:00 AM - 12:00 PM"
                value={scheduleTimeSlot}
                onChange={(event) => setScheduleTimeSlot(event.target.value)}
              />
            </label>
          </div>

          <button className="primary-btn">Add Course</button>
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

        <h3>Current Courses</h3>

        {courses.map((course) => (
          <div className="info-card" key={course.id}>
            <h3>
              {course.code} - {course.name}
            </h3>
            <p>
              <strong>Department:</strong> {course.department}
            </p>
            <p>
              <strong>Level:</strong> {course.level}
            </p>
            <p>
              <strong>Credits:</strong> {course.credits}
            </p>
            <p>
              <strong>Doctor:</strong> {course.professor || "Not assigned"}
            </p>
            <p>
              <strong>Prerequisites:</strong> {course.prerequisiteCodes?.length ? course.prerequisiteCodes.join(", ") : "No prerequisites"}
            </p>
            <p>
              <strong>Schedule:</strong> {course.scheduleDay && course.scheduleTimeSlot ? `${course.scheduleDay} · ${course.scheduleTimeSlot}` : "Schedule not set"}
            </p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
