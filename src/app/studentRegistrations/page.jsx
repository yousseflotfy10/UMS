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

function normalizeValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getCourseFilterValue(course) {
  const id = String(course?.id ?? "").trim();
  const code = String(course?.code ?? "").trim();
  const name = String(course?.name ?? "").trim();
  return JSON.stringify({ id, code, name });
}

function parseCourseFilterValue(value) {
  if (!value || value === "all") return null;

  try {
    const parsed = JSON.parse(value);
    return {
      id: String(parsed.id ?? "").trim(),
      code: String(parsed.code ?? "").trim(),
      name: String(parsed.name ?? "").trim(),
    };
  } catch {
    return {
      id: String(value).trim(),
      code: "",
      name: "",
    };
  }
}

function courseMatchesFilter(course, selectedCourse) {
  if (!selectedCourse) return true;

  const selectedId = normalizeValue(selectedCourse.id);
  const selectedCode = normalizeValue(selectedCourse.code);
  const selectedName = normalizeValue(selectedCourse.name);

  const courseId = normalizeValue(course?.id);
  const courseCode = normalizeValue(course?.code);
  const courseName = normalizeValue(course?.name);

  return Boolean(
    (selectedId && courseId && selectedId === courseId) ||
      (selectedCode && courseCode && selectedCode === courseCode) ||
      (selectedName && courseName && selectedName === courseName)
  );
}

function registrationMatchesFilter(registration, selectedCourse) {
  if (!selectedCourse) return true;

  const selectedId = normalizeValue(selectedCourse.id);
  const selectedCode = normalizeValue(selectedCourse.code);
  const selectedName = normalizeValue(selectedCourse.name);

  const registrationCourseId = normalizeValue(
    registration?.courseId ?? registration?.course_id
  );
  const registrationCourseCode = normalizeValue(
    registration?.courseCode ?? registration?.course_code
  );
  const registrationCourseName = normalizeValue(
    registration?.courseName ?? registration?.course_name
  );

  return Boolean(
    (selectedId && registrationCourseId && selectedId === registrationCourseId) ||
      (selectedCode && registrationCourseCode && selectedCode === registrationCourseCode) ||
      (selectedName && registrationCourseName && selectedName === registrationCourseName)
  );
}

export default function StudentRegistrationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || !["admin", "professor", "doctor"].includes(currentUser.role)) {
        router.push("/signin");
        return;
      }

      const isDoctor = ["professor", "doctor"].includes(currentUser.role);
      const visibleRegistrations = isDoctor
        ? await getProfessorRegistrations(currentUser.name)
        : await getAllRegistrations();

      const visibleCourses = await getRegistrationStats(
        isDoctor ? currentUser.name : ""
      );

      const fallbackCourses = visibleCourses.length ? visibleCourses : await getCourses();
      const coursesWithCounts = fallbackCourses.map((course) => ({
        ...course,
        registeredCount: visibleRegistrations.filter((registration) =>
          registrationMatchesFilter(registration, {
            id: String(course.id ?? ""),
            code: String(course.code ?? ""),
            name: String(course.name ?? ""),
          })
        ).length,
      }));

      setUser(currentUser);
      setCourses(coursesWithCounts);
      setRegistrations(visibleRegistrations || []);
      setLoading(false);
    }
    init();
  }, [router]);

  const selectedCourseObject = useMemo(
    () => parseCourseFilterValue(selectedCourse),
    [selectedCourse]
  );

  const filteredCourses = useMemo(() => {
    if (!selectedCourseObject) return courses;
    return courses.filter((course) => courseMatchesFilter(course, selectedCourseObject));
  }, [courses, selectedCourseObject]);

  const filteredRegistrations = useMemo(() => {
    if (!selectedCourseObject) return registrations;
    return registrations.filter((registration) =>
      registrationMatchesFilter(registration, selectedCourseObject)
    );
  }, [registrations, selectedCourseObject]);

  if (loading) {
    return (
      <PortalShell>
        <div className="content-box">
          <h2>Student Course Registrations</h2>
          <p>Loading registrations...</p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Student Course Registrations</h2>
        <p>
          {["professor", "doctor"].includes(user?.role)
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

        <label className="field-label">
          Filter by course
          <select
            className="form-select"
            value={selectedCourse}
            onChange={(event) => setSelectedCourse(event.target.value)}
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course.id || course.code} value={getCourseFilterValue(course)}>
                {course.name} ({course.code})
              </option>
            ))}
          </select>
        </label>

        {selectedCourseObject && (
          <button
            className="secondary-action-btn inline-clear-btn"
            type="button"
            onClick={() => setSelectedCourse("all")}
          >
            Clear filter / show all courses
          </button>
        )}

        <h3>Course Summary</h3>
        {filteredCourses.length === 0 && <p>No course matches the selected filter.</p>}
        {filteredCourses.map((course) => (
          <div className="info-card compact-card" key={course.id || course.code}>
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
