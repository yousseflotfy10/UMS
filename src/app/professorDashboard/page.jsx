"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser, logoutUser } from "../../../ums-with-courses-src/src/lib/fakeAuth";

export default function ProfessorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "professor") {
      router.push("/signin");
      return;
    }

    setUser(currentUser);
  }, []);

  function handleLogout() {
    logoutUser();
    router.push("/signin");
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Professor Dashboard</h2>

        {user && (
          <p>
            Welcome, <strong>{user.name}</strong>
          </p>
        )}

        <hr />

        <div className="two-column-section">
          <div className="info-card">
            <h3>Upload Grades</h3>
            <p>Add and manage student grades for your courses.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/uploadGrades")}
            >
              Go to Upload Grades
            </button>
          </div>

          <div className="info-card">
            <h3>Add Announcements</h3>
            <p>Post announcements for students.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/addAnnouncements")}
            >
              Add Announcement
            </button>
          </div>

          <div className="info-card">
            <h3>View Messages</h3>
            <p>Check student messages and respond.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/viewMessages")}
            >
              View Messages
            </button>
          </div>

          <div className="info-card">
            <h3>View Announcements</h3>
            <p>See all announcements in the system.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/announcements")}
            >
              View Announcements
            </button>
          </div>
        </div>

        <hr />

        <button className="danger-action-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </PortalShell>
  );
}