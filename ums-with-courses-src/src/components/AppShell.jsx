"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "../lib/fakeAuth";

export default function AppShell({ children, title, subtitle }) {
  const router = useRouter();

  function logout() {
    logoutUser();
    router.push("/signin");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">U</div>
          <div>
            <strong>UMS</strong>
            <span>University Portal</span>
          </div>
        </div>

        <a className="nav-link" href="/dashboard">Dashboard</a>
        <a className="nav-link" href="/messages">Messages</a>
        <a className="nav-link" href="/courses">Courses</a>
        <a className="nav-link" href="/announcements">Announcements</a>
        <a className="nav-link" href="/signin">Sign In</a>
        <a className="nav-link" href="/signup">Sign Up</a>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </header>

        {children}
      </section>
    </main>
  );
}
