"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser, getCurrentProfile } from "../../lib/auth";
import { getMessages, getInbox, getProfessors, sendMessage } from "../../lib/community";

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [professor, setProfessor] = useState("");
  const [content, setContent] = useState("");
  const [sent, setSent] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function init() {
      const authUser = await getCurrentUser();
      const profile = await getCurrentProfile?.();

      if (!authUser) {
        router.push("/signin");
        return;
      }

      if (!profile || profile.role !== "student") {
        router.push("/viewMessages");
        return;
      }

      setUser({ id: authUser.id, name: profile.name, email: authUser.email, role: profile.role });

      const profs = await getProfessors();
      setProfessors(profs);
      setProfessor(profs[0]?.id ?? "");

      const sentMsgs = await getMessages(authUser.id);
      setSent(sentMsgs || []);

      const inboxMsgs = await getInbox(authUser.id);
      setInbox(inboxMsgs || []);
    }

    init();
  }, [router]);

  async function handleSend(event) {
    event.preventDefault();
    setFeedback("");

    if (!professor) {
      setFeedback("Please select a professor first.");
      return;
    }

    if (!content.trim()) {
      setFeedback("Please write a message before sending.");
      return;
    }

    const result = await sendMessage({
      senderId: user.id,
      receiverId: professor,
      content: content.trim(),
    });

    setFeedback(result.message);
    setContent("");

    const sentMsgs = await getMessages(user.id);
    setSent(sentMsgs || []);

    const inboxMsgs = await getInbox(user.id);
    setInbox(inboxMsgs || []);
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Messaging</h2>
        <p>Send questions to your professor and check replies in your inbox.</p>

        <form onSubmit={handleSend}>
          <select
            className="form-select"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
          >
            {professors.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.name}
              </option>
            ))}
          </select>

          <textarea
            className="form-textarea"
            placeholder="Write your question..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button className="primary-btn">Send Message</button>
          {feedback && (
            <div className={feedback.includes("successfully") ? "message success" : "message"}>
              {feedback}
            </div>
          )}
        </form>

        <div className="two-column-section">
          <section>
            <h3>Sent Messages</h3>
            {sent.length === 0 && <p>No messages sent yet.</p>}
            {sent.slice().map((msg) => (
              <div className="info-card" key={msg.id}>
                <h3>To: {msg.receiver_name}</h3>
                <p>{msg.content}</p>
                <p>
                  <strong>Status:</strong> {msg.status || "unread"}
                </p>
                <p className="meta">Sent: {msg.date}</p>
              </div>
            ))}
          </section>

          <section>
            <h3>Inbox</h3>
            {inbox.length === 0 && <p>No received messages yet.</p>}
            {inbox.slice().map((reply) => (
              <div className="info-card" key={reply.id}>
                <h3>From: {reply.sender_name}</h3>
                <p>{reply.content}</p>
                <p className="meta">Received: {reply.date}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
