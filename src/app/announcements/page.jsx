"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import { getVisibleAnnouncements as getVisibleAnnouncementsReal } from "../../lib/community";

export default function AnnouncementsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      const visible = await getVisibleAnnouncementsReal(currentUser);
      setAnnouncements(
        visible.sort((a, b) => new Date(b.date) - new Date(a.date))
      );
    }
    init();
  }, [router]);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Announcements</h2>
        <p>
          {user?.role === "student"
            ? "You can see public announcements and announcements for courses you registered in."
            : "System announcements visible to students."}
        </p>

        {announcements.length === 0 && <p>No announcements available.</p>}

        {announcements.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.content}</p>
            <p>
              <strong>Added by:</strong> {item.professor || "System"}
            </p>
            <p>
              <strong>Audience:</strong> {item.targetCourseName || "All students"}
            </p>
            <p className="meta">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
