"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "../lib/fakeAuth";

export default function PortalShell({ children, showLogout = true }) {
  const router = useRouter();

  function logout() {
    logoutUser();
    router.push("/signin");
  }

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
        </header>

        <nav className="portal-tabs">
          <a href="/dashboard">Dashboard</a>
          <a href="/messages">Messages</a>
          <a href="/courses">Courses</a>
          <a href="/announcements">Announcements</a>
          {showLogout && <a href="#" onClick={logout}>Log out</a>}
        </nav>

        <div className="portal-content">{children}</div>
      </div>
    </main>
  );
}
