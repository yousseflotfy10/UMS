"use client";

import { useEffect, useState } from "react";
import { getAnnouncements } from "../../lib/fakeCommunity";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const data = getAnnouncements().sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    setAnnouncements(data);
  }, []);

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
        </header>

        <nav className="portal-tabs">
          <a href="/dashboard">Dashboard</a>
          <a href="/messages">Messages</a>
          <a href="/announcements">Announcements</a>
        </nav>

        <div className="portal-content">
          <div className="content-box">
            <h2>Announcements</h2>

            <div className="card-list">
              {announcements.map((item) => (
                <div className="info-card" key={item.id}>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                  <p className="meta">Date: {item.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
