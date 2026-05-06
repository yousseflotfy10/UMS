"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser, logoutUser } from "../../lib/fakeAuth";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      router.push("/signin");
      return;
    }

    setUser(currentUser);
  }, [router]);

  function handleLogout() {
    logoutUser();
    router.push("/signin");
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Admin Dashboard</h2>

        {user && (
          <p>
            Welcome, <strong>{user.name}</strong>
          </p>
        )}

        <p>
          Admin can manage classroom bookings and view room availability.
        </p>

        <hr />

        <div className="two-column-section">
          <div className="info-card">
            <h3>Classroom Booking</h3>
            <p>Book classrooms for lectures, labs, or university events.</p>

            <button
              className="small-action-btn"
              onClick={() => router.push("/BookingPage")}
            >
              Book Classroom
            </button>
          </div>

          <div className="info-card">
            <h3>Room Availability</h3>
            <p>View available classrooms and current booked time slots.</p>

            <button
              className="small-action-btn"
              onClick={() => router.push("/viewBooking")}
            >
              View Availability
            </button>
          </div>
          <div className="info-card">
            <h3>Add Courses</h3>
            <p>Add new courses to the university course list.</p>

            <button
                className="small-action-btn"
                onClick={() => router.push("/addCourses")}
            >
                Add Course
            </button>
            </div>
                    </div>

        
      </div>
    </PortalShell>
  );
}