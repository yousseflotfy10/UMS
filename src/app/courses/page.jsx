"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import { getCourses, getRegistrations, registerCourse, dropCourse } from "../../lib/community";

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [feedback, setFeedback] = useState("");

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

  function isRegistered(courseId) {
    return registrations.some((item) => item.courseId === courseId);
  }

  async function handleRegister(courseId) {
    const result = await registerCourse(user, courseId);
    setFeedback(result.message);
    const regs = await getRegistrations();
    setRegistrations(regs.filter((r) => r.userId === user.id));
  }

  async function handleDrop(courseId) {
    const result = await dropCourse(user, courseId);
    setFeedback(result.message);
    const regs = await getRegistrations();
    setRegistrations(regs.filter((r) => r.userId === user.id));
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Courses & Registration</h2>

        {feedback && <div className={feedback.includes("successfully") ? "message success" : "message"}>{feedback}</div>}

        <div className="two-column-section">
          <section>
            <h3>Available Courses</h3>
            {courses.map((course) => (
              <div className="info-card" key={course.id}>
                <h3>{course.name}</h3>
                <p><strong>Code:</strong> {course.code}</p>
                <p><strong>Department:</strong> {course.department}</p>
                <p><strong>Doctor:</strong> {course.professor || "Not assigned"}</p>
                <p><strong>Level:</strong> {course.level} | <strong>Credits:</strong> {course.credits}</p>

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
