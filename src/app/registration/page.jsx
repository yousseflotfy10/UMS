"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import {
  getCourses,
  getRegistrations,
  registerCourse,
  getPrerequisiteSummary,
} from "../../lib/community";

export default function CourseRegistrationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState("");

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

  function isRegistered(courseId) {
    return registrations.some((item) => item.courseId === courseId);
  }

  async function handleRegister(courseId) {
    const result = await registerCourse(user, courseId);
    setMessage(result.message);
    const allRegs = await getRegistrations();
    setRegistrations(allRegs.filter((item) => item.userId === user.id));
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Course Registration</h2>
        <p>Select the courses you want to register in.</p>

        {message && (
          <div
            className={
              message.includes("successfully") ? "message success" : "message"
            }
          >
            {message}
          </div>
        )}

        {courses.length === 0 && <p>No courses found.</p>}

        {courses.map((course) => (
          <div className="info-card" key={course.id}>
            <h3>{course.name}</h3>
            <p>
              <strong>Code:</strong> {course.code}
            </p>
            <p>
              <strong>Doctor:</strong> {course.professor || "Not assigned"}
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
