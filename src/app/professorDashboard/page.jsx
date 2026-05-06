"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser, logoutUser } from "../../lib/fakeAuth";
import { getMessagesForUser } from "../../lib/fakeCommunity";
import {
  getProfessorRegistrations,
  getRegistrationStats,
} from "../../lib/fakeCurriculum";

export default function ProfessorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [courseStats, setCourseStats] = useState([]);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "professor") {
      router.push("/signin");
      return;
    }

    setUser(currentUser);
    setMessages(getMessagesForUser(currentUser));
    setRegistrations(getProfessorRegistrations(currentUser.name));
    setCourseStats(getRegistrationStats(currentUser.name));
  }, [router]);

  function handleLogout() {
    logoutUser();
    router.push("/signin");
  }

  const unreadMessages = messages.filter((message) => message.status !== "replied");

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Doctor Dashboard</h2>

        {user && (
          <p>
            Welcome, <strong>{user.name}</strong>. From here you can push
            announcements, review student messages, reply to students, upload
            grades, and check who registered in your courses.
          </p>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span>Student Messages</span>
            <strong>{messages.length}</strong>
            <p>{unreadMessages.length} waiting for reply</p>
          </div>

          <div className="stat-card">
            <span>Registered Students</span>
            <strong>{registrations.length}</strong>
            <p>Across your assigned courses</p>
          </div>

          <div className="stat-card">
            <span>Your Courses</span>
            <strong>{courseStats.length}</strong>
            <p>Course registration overview</p>
          </div>
        </div>

        <hr />

        <div className="two-column-section">
          <div className="info-card">
            <h3>Push Announcement</h3>
            <p>Create an announcement for all students or one specific course.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/addAnnouncements")}
            >
              Add Announcement
            </button>
          </div>

          <div className="info-card">
            <h3>Student Messages</h3>
            <p>Read questions sent by students and send replies to their inbox.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/viewMessages")}
            >
              View Messages
            </button>
          </div>

          <div className="info-card">
            <h3>Student Course Registrations</h3>
            <p>See students registered in your courses and filter by course.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/studentRegistrations")}
            >
              View Registrations
            </button>
          </div>

          <div className="info-card">
            <h3>Upload Grades</h3>
            <p>Add and manage student grades for your course sections.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/uploadGrades")}
            >
              Upload Grades
            </button>
          </div>
        </div>

        <hr />

        <h3>Course Overview</h3>
        {courseStats.length === 0 && <p>No courses assigned to you yet.</p>}
        {courseStats.map((course) => (
          <div className="info-card" key={course.id}>
            <h3>
              {course.name} ({course.code})
            </h3>
            <p>
              <strong>Department:</strong> {course.department}
            </p>
            <p>
              <strong>Registered students:</strong> {course.registeredCount}
            </p>
          </div>
        ))}

        <button className="danger-action-btn" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </PortalShell>
  );
}
