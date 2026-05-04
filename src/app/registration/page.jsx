"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
export default function CourseRegistrationPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function getCourses() {
      const { data, error } = await supabase.from("courses").select("*");

      if (error) {
        console.log("ERROR:", error);
        setMessage("Could not load courses.");
        return;
      }

      setCourses(data || []);
    }

    getCourses();
  }, []);

  function handleSelectCourse(course) {
    const alreadySelected = selectedCourses.find((c) => c.id === course.id);

    if (alreadySelected) {
      setSelectedCourses(selectedCourses.filter((c) => c.id !== course.id));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  }

  function handleRegister() {
    if (selectedCourses.length === 0) {
      setMessage("Please select at least one course.");
      return;
    }

    localStorage.setItem("registeredCourses", JSON.stringify(selectedCourses));
    setMessage("Courses registered successfully.");
  }

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
        </header>

        <nav className="portal-tabs">
          <a href="/">Courses</a>
          <a href="/register">Course Registration</a>
          <a href="/signin">Sign in</a>
        </nav>

        <div className="portal-content">
          <div className="dashboard-box">
            <h2>Course Registration</h2>
            <p>Select the courses you want to register in.</p>

            {courses.length === 0 && <p>No courses found.</p>}

            {courses.map((course) => {
              const isSelected = selectedCourses.find(
                (c) => c.id === course.id
              );

              return (
                <div
                  key={course.id}
                  style={{
                    border: "1px solid #d6d6d6",
                    padding: "14px",
                    marginBottom: "12px",
                  }}
                >
                  <h3>{course.name}</h3>
                  <p>Code: {course.code}</p>

                  <button
                    className="primary-btn"
                    onClick={() => handleSelectCourse(course)}
                  >
                    {isSelected ? "Remove" : "Add Course"}
                  </button>
                </div>
              );
            })}

            <div className="dashboard-actions">
              <button className="primary-btn" onClick={handleRegister}>
                Register Selected Courses
              </button>
            </div>

            {message && <div className="message success">{message}</div>}

            {selectedCourses.length > 0 && (
              <>
                <hr />
                <h3>Selected Courses</h3>
                <ul>
                  {selectedCourses.map((course) => (
                    <li key={course.id}>
                      {course.name} - {course.code}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}