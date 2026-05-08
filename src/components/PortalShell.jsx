"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser, getCurrentAppUser } from "../lib/auth";

const STAFF_ROLES = ["professor", "doctor"];

export default function PortalShell({ children, showLogout = true }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const role = user?.role || "student";
  const isStudent = role === "student";
  const isStaff = STAFF_ROLES.includes(role);
  const isAdmin = role === "admin";

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const current = await getCurrentAppUser();
        if (mounted) setUser(current);
      } catch (error) {
        if (mounted) setUser(null);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  async function logout(event) {
    event.preventDefault();
    await logoutUser();
    router.push("/signin");
  }

  function goDashboard(event) {
    event.preventDefault();
    router.push("/dashboard");
  }

  function goProfile(event) {
    event.preventDefault();
    router.push("/staffProfile");
  }

  function goMessages(event) {
    event.preventDefault();
    router.push(isStudent ? "/messages" : "/viewMessages");
  }

  function goCourses(event) {
    event.preventDefault();
    router.push("/courses");
  }

  function goGrades(event) {
    event.preventDefault();
    router.push(isStaff ? "/uploadGrades" : "/viewGrades");
  }

  function goRooms(event) {
    event.preventDefault();
    router.push(isAdmin ? "/BookingPage" : "/viewBooking");
  }

  function goAnnouncements(event) {
    event.preventDefault();
    router.push("/announcements");
  }

  const roleLabel = isAdmin ? "Admin" : isStaff ? "Doctor" : role;

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
          {user && (
            <p className="portal-user-line">
              {user.name} · {roleLabel}
            </p>
          )}
        </header>

        <nav className="portal-tabs">
          <a href="#" onClick={goDashboard}>Dashboard</a>
          <a href="#" onClick={goProfile}>Profile</a>
          {(isStudent || isStaff) && <a href="#" onClick={goMessages}>Messages</a>}
          {isStudent && <a href="#" onClick={goCourses}>Courses</a>}
          {(isStudent || isStaff) && <a href="#" onClick={goGrades}>Grades</a>}
          <a href="#" onClick={goRooms}>Rooms</a>
          <a href="#" onClick={goAnnouncements}>Announcements</a>
          {showLogout && <a href="#" onClick={logout}>Log out</a>}
        </nav>

        <div className="portal-content">{children}</div>
      </div>
    </main>
  );
}
