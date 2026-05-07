"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import { getGradesForStudent } from "../../lib/grades";

export default function ViewGradesPage() {
  const [user, setUser] = useState(null);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();
      setUser(currentUser);

      if (currentUser) {
        setGrades(await getGradesForStudent(currentUser));
      }
    }
    init();
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