"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import { getMessagesForUser } from "../../lib/community";

const STAFF_ROLES = ["professor", "doctor"];

export default function ViewMessagesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser) {
        router.push("/signin");
        return;
      }

      if (!STAFF_ROLES.includes(currentUser.role)) {
        router.push("/messages");
        return;
      }

      setUser(currentUser);
      setMessages(await getMessagesForUser(currentUser));
    }

    init();
  }, [router]);

  const sortedMessages = useMemo(
    () =>
      messages
        .slice()
        .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)),
    [messages]
  );

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Message History</h2>
        <p>
          View previous messages sorted by date. Each message shows sender and content.
        </p>

        <hr />

        {!user && <p>Loading messages...</p>}
        {user && sortedMessages.length === 0 && <p>No messages yet.</p>}

        {sortedMessages.map((message) => (
          <div className="info-card" key={message.id}>
            <h3>{message.sender} → {message.receiver}</h3>
            <p>
              <strong>Sender:</strong> {message.sender}
            </p>
            <p>
              <strong>Content:</strong> {message.content}
            </p>
            <p className="meta">Sent: {message.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
