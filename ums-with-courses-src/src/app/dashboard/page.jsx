"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import { getRegistrations } from "../../lib/fakeCurriculum";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/signin");
      return;
    }

    setUser(currentUser);
    setRegistrations(getRegistrations(currentUser.email));
  }, [router]);

  return (
    <AppShell
      title="Dashboard"
      subtitle={user ? `Welcome back, ${user.name}` : "Welcome to UMS"}
    >
      <div className="content-grid">
        <div className="stat-card">
          <div className="icon">👤</div>
          <h3>Sign Up</h3>
          <p>Users can create accounts with required field validation.</p>
        </div>

        <div className="stat-card">
          <div className="icon">🔐</div>
          <h3>Sign In</h3>
          <p>Users can securely access their account using credentials.</p>
        </div>

        <div className="stat-card">
          <div className="icon">💬</div>
          <h3>Messaging</h3>
          <p>Students can send messages and receive professor replies.</p>
        </div>

        <div className="stat-card">
          <div className="icon">📚</div>
          <h3>Courses</h3>
          <p>Students can view available courses and register for them.</p>
        </div>
      </div>

      <section className="panel">
        <h2>My Course Registrations</h2>

        {registrations.length === 0 && (
          <p>
            You have not registered for any courses yet. Go to{" "}
            <a href="/courses">Courses & Registration</a> to register.
          </p>
        )}

        {registrations.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>
              {item.courseName} ({item.courseCode})
            </h3>
            <p>
              <strong>Department:</strong> {item.department}
            </p>
            <p>
              <strong>Level:</strong> {item.level} | <strong>Credits:</strong>{" "}
              {item.credits}
            </p>
            <p className="meta">Registered on: {item.date}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Sprint 1 Progress</h2>
        <ul className="check-list">
          <li><span>✓</span>User can enter name, email, and password</li>
          <li><span>✓</span>System validates required fields</li>
          <li><span>✓</span>System prevents duplicate accounts</li>
          <li><span>✓</span>User can sign in with valid credentials</li>
          <li><span>✓</span>Message content is displayed correctly</li>
          <li><span>✓</span>Announcements are displayed clearly</li>
          <li><span>✓</span>Available courses are displayed</li>
          <li><span>✓</span>Course registration is saved locally</li>
        </ul>
      </section>
    </AppShell>
  );
}
