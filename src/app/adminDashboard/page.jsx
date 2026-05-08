"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser, logoutUser, getStudents, getProfessors } from "../../lib/auth";
import { getMessagesForUser, getAllRegistrations, getCourses } from "../../lib/community";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState({
    students: 0,
    professors: 0,
    courses: 0,
    registrations: 0,
    messages: 0,
  });

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || currentUser.role !== "admin") {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      const students = await getStudents();
      const professors = await getProfessors();
      const courses = await getCourses();
      const registrations = await getAllRegistrations();
      const messages = await getMessagesForUser(currentUser);
      setSummary({
        students: students.length,
        professors: professors.length,
        courses: courses.length,
        registrations: registrations.length,
        messages: messages.length,
      });
    }
    init();
  }, [router]);

  async function handleLogout() {
    await logoutUser();
    router.push("/signin");
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Admin Dashboard</h2>

        {user && (
          <p>
            Welcome, <strong>{user.name}</strong>. Admin can manage the system,
            courses, announcements, rooms, student messages, and course
            registrations.
          </p>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <span>Students</span>
            <strong>{summary.students}</strong>
            <p>Registered student accounts</p>
          </div>
          <div className="stat-card">
            <span>Doctors</span>
            <strong>{summary.professors}</strong>
            <p>Professor accounts</p>
          </div>
          <div className="stat-card">
            <span>Courses</span>
            <strong>{summary.courses}</strong>
            <p>Available courses</p>
          </div>
          <div className="stat-card">
            <span>Registrations</span>
            <strong>{summary.registrations}</strong>
            <p>Student course registrations</p>
          </div>
        </div>

        <hr />

        <div className="two-column-section">
          <div className="info-card">
            <h3>Add Courses</h3>
            <p>Add new courses and assign each course to a doctor.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/addCourses")}
            >
              Add Course
            </button>
          </div>

          <div className="info-card">
            <h3>Student Course Registrations</h3>
            <p>View all students and the courses they registered in.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/studentRegistrations")}
            >
              View Registrations
            </button>
          </div>

          <div className="info-card">
            <h3>Push Announcement</h3>
            <p>Publish announcements for all students or for one course.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/addAnnouncements")}
            >
              Add Announcement
            </button>
          </div>

          <div className="info-card">
            <h3>Student Messages</h3>
            <p>Review messages sent by students to doctors.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/viewMessages")}
            >
              View Messages
            </button>
          </div>

          <div className="info-card">
            <h3>Classroom Booking</h3>
            <p>Book, edit, or delete classroom bookings for lectures, labs, or university events.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/BookingPage")}
            >
              Manage Bookings
            </button>
          </div>

          <div className="info-card">
            <h3>Room Availability</h3>
            <p>View booked rooms and manage the current schedule with optional filters.</p>
            <button
              className="small-action-btn"
              onClick={() => router.push("/viewBooking")}
            >
              View / Edit Bookings
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
