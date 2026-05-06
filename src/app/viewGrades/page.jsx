"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import { getGrades } from "../../lib/fakeGrades";

export default function ViewGradesPage() {
  const [user, setUser] = useState(null);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const allGrades = getGrades();
      const myGrades = allGrades.filter(
        (grade) =>
          grade.studentEmail.toLowerCase() ===
          currentUser.email.toLowerCase()
      );

      setGrades(myGrades);
    }
  }, []);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>My Grades</h2>

        {user && (
          <p>
            Student: <strong>{user.name}</strong>
          </p>
        )}

        <hr />

        {!user && <div className="message">Please sign in first.</div>}

        {user && grades.length === 0 && (
          <div className="message">
            No grades available for your account yet.
          </div>
        )}

        {grades.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>
              {item.courseCode} - {item.courseName}
            </h3>

            <p>
              <strong>Grade:</strong> {item.grade}
            </p>

            <p>
              <strong>Feedback:</strong> {item.feedback || "No feedback"}
            </p>

            <p className="meta">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}