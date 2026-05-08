"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import {
  getCourses,
  getRegistrations,
  registerCourse,
  getPrerequisiteSummary,
  getCourseScheduleLabel,
} from "../../lib/community";

export default function CourseRegistrationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || currentUser.role !== "student") {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      setCourses(await getCourses());
      const allRegs = await getRegistrations();
      setRegistrations(allRegs.filter((item) => item.userId === currentUser.id));
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

  async function handleRegister(courseId) {
    setMessage("");
    const result = await registerCourse(user, courseId);
    setMessage(result.message);
    const allRegs = await getRegistrations();
    setRegistrations(allRegs.filter((item) => item.userId === user.id));
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Course Registration</h2>
        <p>Select the courses you want to register in. The system checks prerequisites and schedule conflicts before saving.</p>

        {message && (
          <div
            className={
              message.includes("successfully") ? "message success" : "message"
            }
          >
            {message}
          </div>
        )}

        <div className="filter-panel">
          <label className="field-label">
            Search by course name or code
            <input
              className="form-input"
              value={search}
              placeholder="Search courses..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label className="field-label">
            Department
            <select className="form-select" value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
              <option value="">All departments</option>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </select>
          </label>

          <label className="field-label">
            Level
            <select className="form-select" value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
              <option value="">All levels</option>
              {levels.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
          </label>
        </div>

        {filteredCourses.length === 0 && <p>No courses found.</p>}

        {filteredCourses.map((course) => (
          <div className="info-card" key={course.id}>
            <h3>{course.name}</h3>
            <p>
              <strong>Code:</strong> {course.code}
            </p>
            <p>
              <strong>Department:</strong> {course.department || "Not specified"}
            </p>
            <p>
              <strong>Level:</strong> {course.level || "Not specified"}
            </p>
            <p>
              <strong>Doctor:</strong> {course.professor || "Not assigned"}
            </p>
            <p>
              <strong>Schedule:</strong> {getCourseScheduleLabel(course)}
            </p>
            <p>
              <strong>Prerequisites:</strong> {getPrerequisiteSummary(course, courses)}
            </p>
            <button
              className={isRegistered(course.id) ? "danger-action-btn" : "small-action-btn"}
              onClick={() => handleRegister(course.id)}
              disabled={isRegistered(course.id)}
            >
              {isRegistered(course.id) ? "Already Registered" : "Register Course"}
            </button>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
