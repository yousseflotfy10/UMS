"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import {
  getCourses,
  getRegistrations,
  registerCourse,
  dropCourse,
  getPrerequisiteSummary,
  getCourseScheduleLabel,
} from "../../lib/community";

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }
      setUser(currentUser);
      const data = await getCourses();
      setCourses(data || []);
      const regs = await getRegistrations();
      setRegistrations(regs.filter((r) => r.userId === currentUser.id));
    }

    init();
  }, [router]);

  const departments = useMemo(
    () => [...new Set(courses.map((course) => course.department).filter(Boolean))].sort(),
    [courses]
  );

  const levels = useMemo(
    () => [...new Set(courses.map((course) => String(course.level || "")).filter(Boolean))].sort(),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSearch =
        !q ||
        String(course.name || "").toLowerCase().includes(q) ||
        String(course.code || "").toLowerCase().includes(q);
      const matchesDepartment = !departmentFilter || course.department === departmentFilter;
      const matchesLevel = !levelFilter || String(course.level || "") === String(levelFilter);
      return matchesSearch && matchesDepartment && matchesLevel;
    });
  }, [courses, search, departmentFilter, levelFilter]);

  function isRegistered(courseId) {
    return registrations.some((item) => Number(item.courseId) === Number(courseId));
  }

  async function reloadRegistrations(currentUser = user) {
    const regs = await getRegistrations();
    setRegistrations(regs.filter((r) => r.userId === currentUser.id));
  }

  async function handleRegister(courseId) {
    setFeedback("");
    const result = await registerCourse(user, courseId);
    setFeedback(result.message);
    await reloadRegistrations();
  }

  async function handleDrop(courseId) {
    setFeedback("");
    const result = await dropCourse(user, courseId);
    setFeedback(result.message);
    await reloadRegistrations();
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Courses & Registration</h2>
        <p>Search courses, filter them, and register only when validations pass.</p>

        {feedback && <div className={feedback.includes("successfully") ? "message success" : "message"}>{feedback}</div>}

        <div className="filter-panel">
          <label className="field-label">
            Search by name or code
            <input
              className="form-input"
              placeholder="Example: CS101 or Database"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field-label">
            Department
            <select
              className="form-select"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Level
            <select
              className="form-select"
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="">All levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="two-column-section">
          <section>
            <div className="card-title-row">
              <h3>Available Courses</h3>
              <span className="status-pill done">{filteredCourses.length} found</span>
            </div>
            {filteredCourses.length === 0 && <p>No courses match your filters.</p>}
            {filteredCourses.map((course) => (
              <div className="info-card" key={course.id}>
                <h3>{course.name}</h3>
                <p><strong>Code:</strong> {course.code}</p>
                <p><strong>Department:</strong> {course.department}</p>
                <p><strong>Doctor:</strong> {course.professor || "Not assigned"}</p>
                <p><strong>Level:</strong> {course.level} | <strong>Credits:</strong> {course.credits}</p>
                <p><strong>Schedule:</strong> {getCourseScheduleLabel(course)}</p>
                <p><strong>Prerequisites:</strong> {getPrerequisiteSummary(course, courses)}</p>

                {isRegistered(course.id) ? (
                  <button className="danger-action-btn" onClick={() => handleDrop(course.id)}>Drop Course</button>
                ) : (
                  <button className="small-action-btn" onClick={() => handleRegister(course.id)}>Register</button>
                )}
              </div>
            ))}
          </section>

          <section>
            <h3>My Registered Courses</h3>
            {registrations.length === 0 && <p>No registered courses yet.</p>}
            {registrations.map((item) => (
              <div className="info-card" key={item.id}>
                <h3>{item.courseName} ({item.courseCode})</h3>
                <p><strong>Department:</strong> {item.department}</p>
                <p><strong>Doctor:</strong> {item.professor || "Not assigned"}</p>
                <p><strong>Schedule:</strong> {getCourseScheduleLabel(item)}</p>
                <p className="meta">Registered on: {item.date}</p>
                <button className="danger-action-btn" onClick={() => handleDrop(item.courseId)}>Drop Course</button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
