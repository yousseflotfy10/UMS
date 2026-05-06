"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser, getCurrentAppUser } from "../lib/auth";

export default function PortalShell({ children, showLogout = true }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const role = user?.role || "student";

  useEffect(() => {
    async function loadUser() {
      const current = await getCurrentAppUser();
      setUser(current);
    }
    loadUser();
  }, []);

  async function logout(e) {
    e.preventDefault();
    await logoutUser();
    router.push("/signin");
  }

  function goDashboard(e) {
    e.preventDefault();

    if (role === "admin") router.push("/adminDashboard");
    else if (role === "professor") router.push("/professorDashboard");
    else router.push("/dashboard");
  }

  function goMessages(e) {
    e.preventDefault();

    if (role === "admin" || role === "professor") {
      router.push("/viewMessages");
    } else {
      router.push("/messages");
    }
  }

  function goAnnouncements(e) {
    e.preventDefault();

    if (role === "admin" || role === "professor") {
      router.push("/addAnnouncements");
    } else {
      router.push("/announcements");
    }
  }

  function goCourses(e) {
    e.preventDefault();

    if (role === "admin") {
      router.push("/addCourses");
    } else if (role === "professor") {
      router.push("/studentRegistrations");
    } else {
      router.push("/courses");
    }
  }

  function goGrades(e) {
    e.preventDefault();

    if (role === "professor") {
      router.push("/uploadGrades");
    } else {
      router.push("/viewGrades");
    }
  }

  function goRooms(e) {
    e.preventDefault();

    if (role === "admin") {
      router.push("/BookingPage");
    } else {
      router.push("/viewBooking");
    }
  }

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
          {user && (
            <p className="portal-user-line">
              {user.name} · {role === "professor" ? "Doctor" : role}
            </p>
          )}
        </header>

        <nav className="portal-tabs">
          <a href="#" onClick={goDashboard}>Dashboard</a>

          <a href="#" onClick={goMessages}>Messages</a>

          <a href="#" onClick={goCourses}>
            {role === "professor" || role === "admin" ? "Registrations" : "Courses"}
          </a>

          {(role === "professor" || role === "student") && (
            <a href="#" onClick={goGrades}>Grades</a>
          )}

          <a href="#" onClick={goRooms}>Rooms</a>

          <a href="#" onClick={goAnnouncements}>Announcements</a>

          {showLogout && (
            <a href="#" onClick={logout}>Log out</a>
          )}
        </nav>

        <div className="portal-content">{children}</div>
      </div>
    </main>
  );
}
