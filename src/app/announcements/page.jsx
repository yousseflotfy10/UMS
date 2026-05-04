"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import { getAnnouncements } from "../../lib/fakeCommunity";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    setAnnouncements(getAnnouncements().sort((a, b) => new Date(b.date) - new Date(a.date)));
  }, []);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Announcements</h2>

        {announcements.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.content}</p>
            <p className="meta">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
