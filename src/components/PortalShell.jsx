"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser, getCurrentAppUser } from "../lib/auth";

export default function PortalShell({ children, showLogout = true }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const role = user?.role || "student";

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

  async function logout(e) {
    e.preventDefault();
    await logoutUser();
    router.push("/signin");
  }

  function goDashboard(e) {
    e.preventDefault();

    if (role === "admin") router.push("/adminDashboard");
    else if ((role === "professor" || role === "doctor")) router.push("/professorDashboard");
    else router.push("/dashboard");
  }

  function goMessages(e) {
    e.preventDefault();

    if (role === "admin" || (role === "professor" || role === "doctor")) {
      router.push("/viewMessages");
    } else {
      router.push("/messages");
    }
  }

  function goProfile(e) {
    e.preventDefault();
    router.push("/staffProfile");
  }

  function goAnnouncements(e) {
    e.preventDefault();

    if (role === "admin" || (role === "professor" || role === "doctor")) {
      router.push("/addAnnouncements");
    } else {
      router.push("/announcements");
    }
  }

  function goCourses(e) {
    e.preventDefault();

    if (role === "admin") {
      router.push("/addCourses");
    } else if ((role === "professor" || role === "doctor")) {
      router.push("/studentRegistrations");
    } else {
      router.push("/courses");
    }
  }

  function goGrades(e) {
    e.preventDefault();

    if ((role === "professor" || role === "doctor")) {
      router.push("/uploadGrades");
    } else {
      router.push("/viewGrades");
    }
  }

  function goRooms(e) {
    e.preventDefault();

    if (role === "admin" || (role === "professor" || role === "doctor")) {
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
              {user.name} · {(role === "professor" || role === "doctor") ? "Doctor" : role}
            </p>
          )}
        </header>

        <nav className="portal-tabs">
          <a href="#" onClick={goDashboard}>Dashboard</a>

          <a href="#" onClick={goProfile}>Profile</a>

          <a href="#" onClick={goMessages}>Messages</a>

          <a href="#" onClick={goCourses}>
            {role === "admin" ? "Courses" : (role === "professor" || role === "doctor") ? "Registrations" : "Courses"}
          </a>

          {((role === "professor" || role === "doctor") || role === "student") && (
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
