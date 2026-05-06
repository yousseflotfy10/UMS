"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import {
  getAllRegistrations,
  getCourses,
  getProfessorRegistrations,
  getRegistrationStats,
} from "../../lib/community";

export default function StudentRegistrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || !["admin", "professor"].includes(currentUser.role)) {
        router.push("/signin");
        return;
      }

      const visibleCourses = await getRegistrationStats(
        currentUser.role === "professor" ? currentUser.name : ""
      );

      const visibleRegistrations =
        currentUser.role === "professor"
          ? await getProfessorRegistrations(currentUser.name)
          : await getAllRegistrations();

      setUser(currentUser);
      setCourses(visibleCourses.length ? visibleCourses : await getCourses());
      setRegistrations(visibleRegistrations);
    }
    init();
  }, [router]);

  const filteredRegistrations = useMemo(() => {
    if (selectedCourse === "all") return registrations;

    return registrations.filter(
      (registration) => Number(registration.courseId) === Number(selectedCourse)
    );
  }, [registrations, selectedCourse]);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Student Course Registrations</h2>
        <p>
          {user?.role === "professor"
            ? "View students registered in your assigned courses."
            : "View all student course registrations across the system."}
        </p>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Total Registrations</span>
            <strong>{registrations.length}</strong>
            <p>Visible to your account</p>
          </div>
          <div className="stat-card">
            <span>Courses</span>
            <strong>{courses.length}</strong>
            <p>Available in this view</p>
          </div>
          <div className="stat-card">
            <span>Current Filter</span>
            <strong>{filteredRegistrations.length}</strong>
            <p>Matching registration records</p>
          </div>
        </div>

        <hr />

        <label>
          <strong>Filter by course</strong>
          <select
            className="form-select"
            value={selectedCourse}
            onChange={(event) => setSelectedCourse(event.target.value)}
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </label>

        <h3>Course Summary</h3>
        {courses.map((course) => (
          <div className="info-card compact-card" key={course.id}>
            <h3>
              {course.name} ({course.code})
            </h3>
            <p>
              <strong>Doctor:</strong> {course.professor || "Not assigned"}
            </p>
            <p>
              <strong>Registered students:</strong> {course.registeredCount || 0}
            </p>
          </div>
        ))}

        <hr />

        <h3>Registered Students</h3>
        {filteredRegistrations.length === 0 && (
          <p>No students registered in this course yet.</p>
        )}

        {filteredRegistrations
          .slice()
          .reverse()
          .map((registration) => (
            <div className="info-card" key={registration.id}>
              <h3>{registration.studentName || "Student"}</h3>
              <p>
                <strong>Email:</strong> {registration.studentEmail}
              </p>
              <p>
                <strong>Course:</strong> {registration.courseName} (
                {registration.courseCode})
              </p>
              <p>
                <strong>Doctor:</strong> {registration.professor || "Not assigned"}
              </p>
              <p>
                <strong>Level:</strong> {registration.level} | <strong>Credits:</strong>{" "}
                {registration.credits}
              </p>
              <p className="meta">Registered on: {registration.date}</p>
            </div>
          ))}
      </div>
    </PortalShell>
  );
}
