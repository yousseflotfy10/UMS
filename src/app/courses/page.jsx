"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import { getCourses, getRegistrations, registerCourse, dropCourse } from "../../lib/fakeCurriculum";

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/signin");
      return;
    }
    setUser(currentUser);
    setCourses(getCourses());
    setRegistrations(getRegistrations(currentUser.email));
  }, [router]);

  function isRegistered(courseId) {
    return registrations.some((item) => item.courseId === courseId);
  }

  function handleRegister(courseId) {
    const result = registerCourse(user.email, courseId);
    setFeedback(result.message);
    setRegistrations(getRegistrations(user.email));
  }

  function handleDrop(courseId) {
    const result = dropCourse(user.email, courseId);
    setFeedback(result.message);
    setRegistrations(getRegistrations(user.email));
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
