"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import {
  getMessagesForUser,
  replyToMessage,
  getRegistrations,
} from "../../lib/community";

export default function ViewMessagesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || !["admin", "professor", "doctor"].includes(currentUser.role)) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      setMessages(await getMessagesForUser(currentUser));
      setRegistrations(await getRegistrations());
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

  async function refreshMessages(currentUser = user) {
    if (!currentUser) return;
    setMessages(await getMessagesForUser(currentUser));
  }

  async function handleReply(message) {
    const content = replyText[message.id];

    if (!content || !content.trim()) {
      setFeedback("Please write a reply first.");
      return;
    }

    const result = await replyToMessage({
      professor: user.name,
      studentEmail: message.senderEmail,
      content: content.trim(),
      originalMessage: message.content,
      originalMessageId: message.id,
    });

    setFeedback(result.message);

    if (result.success) {
      setReplyText({
        ...replyText,
        [message.id]: "",
      });
      await refreshMessages();
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Message History</h2>
        <p>
          View previous messages sorted by date. Each message shows the sender,
          content, and delivery time.
        </p>

        <hr />

        {feedback && (
          <div
            className={
              feedback.includes("successfully") ? "message success" : "message"
            }
          >
            {feedback}
          </div>
        )}

        {sortedMessages.length === 0 && <p>No messages yet.</p>}

        {sortedMessages.map((message) => {
          const studentCourses = registrations.filter(
            (item) => (item.studentEmail || "").toLowerCase() === (message.senderEmail || "").toLowerCase()
          );
          const isReplyFromStaff = ["admin", "professor", "doctor"].includes(user?.role) && message.senderId === user?.id;

          return (
            <div className="info-card" key={message.id}>
              <div className="card-title-row">
                <h3>{message.sender} → {message.receiver}</h3>
                <span className={`status-pill ${message.status === "replied" ? "done" : "open"}`}>
                  {message.status === "replied" ? "Replied" : "Open"}
                </span>
              </div>

              <p>
                <strong>Sender:</strong> {message.sender} {message.senderEmail ? `(${message.senderEmail})` : ""}
              </p>

              <p>
                <strong>Content:</strong> {message.content}
              </p>

              {studentCourses.length > 0 && (
                <div className="mini-list">
                  <strong>Student registered courses:</strong>
                  {studentCourses.map((course) => (
                    <span key={course.id}>
                      {course.courseName} ({course.courseCode})
                    </span>
                  ))}
                </div>
              )}

              <p className="meta">Sent: {message.date}</p>

              {!isReplyFromStaff && message.senderEmail && studentCourses.length > 0 && (
                <>
                  <textarea
                    className="form-textarea"
                    placeholder="Write reply..."
                    value={replyText[message.id] || ""}
                    onChange={(e) =>
                      setReplyText({
                        ...replyText,
                        [message.id]: e.target.value,
                      })
                    }
                    maxLength={1000}
                  />

                  <button
                    className="small-action-btn"
                    onClick={() => handleReply(message)}
                  >
                    Send Reply
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}
