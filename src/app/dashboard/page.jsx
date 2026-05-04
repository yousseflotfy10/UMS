"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logoutUser } from "../../lib/fakeAuth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
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
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>Ain Shams University - Faculty of Engineering</h1>
        </header>

        <nav className="portal-tabs">
          <a href="/signin">Sign in</a>
          <a href="/signup">Create account</a>
          <a href="/dashboard">Dashboard</a>
        </nav>

        <div className="portal-content">
          <div className="dashboard-box">
            <h2>University Management System</h2>

            {user && (
              <>
                <p>
                  <strong>Name:</strong> {user.name}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
              </>
            )}

            <hr />

            <h3>Sprint 1 Completed Features</h3>
            <ul>
              <li>User Sign Up</li>
              <li>User Sign In</li>
              <li>Required field validation</li>
              <li>Duplicate account prevention</li>
              <li>Invalid login error message</li>
            </ul>

            <div className="dashboard-actions">
              <button className="primary-btn" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
