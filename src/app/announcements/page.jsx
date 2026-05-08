"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import { getAnnouncements } from "../../lib/community";

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser) {
        router.push("/signin");
        return;
      }

      const data = await getAnnouncements();
      setAnnouncements(data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
    }

    init();
  }, [router]);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Announcements</h2>
        <p>Announcements are displayed with title, content, and date.</p>

        {announcements.length === 0 && <p>No announcements available.</p>}

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
