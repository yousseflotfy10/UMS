"use client";

import { useEffect, useState } from "react";

export default function MyCoursesPage() {
  const [registeredCourses, setRegisteredCourses] = useState([]);

  useEffect(() => {
    const savedCourses = localStorage.getItem("registeredCourses");
    setRegisteredCourses(savedCourses ? JSON.parse(savedCourses) : []);
  }, []);

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
        </header>

        <nav className="portal-tabs">
          <a href="/">Courses</a>
          <a href="/registration">Course Registration</a>
          <a href="/my-courses">My Courses</a>
          <a href="/signin">Sign in</a>
        </nav>

        <div className="portal-content">
          <div className="dashboard-box">
            <h2>My Courses</h2>
            <p>These are the courses you registered for.</p>

            {registeredCourses.length === 0 ? (
              <p>You have not registered for any courses yet.</p>
            ) : (
              <div className="course-card-grid">
                {registeredCourses.map((course) => (
                  <div className="course-card" key={course.id}>
                    <h3>{course.name}</h3>
                    <p>
                      <strong>Code:</strong> {course.code}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}