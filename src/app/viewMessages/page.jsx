"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import {
  getMessagesForUser,
  replyToMessage,
} from "../../lib/fakeCommunity";
import { getRegistrations } from "../../lib/fakeCurriculum";

export default function ViewMessagesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || !["admin", "professor"].includes(currentUser.role)) {
      router.push("/signin");
      return;
    }

    setUser(currentUser);
    setMessages(getMessagesForUser(currentUser));
  }, [router]);

  function refreshMessages(currentUser = user) {
    if (!currentUser) return;
    setMessages(getMessagesForUser(currentUser));
  }

  function handleReply(message) {
    const content = replyText[message.id];

    if (!content || !content.trim()) {
      setFeedback("Please write a reply first.");
      return;
    }

    const result = replyToMessage({
      professor: user.name,
      studentEmail: message.senderEmail,
      content: content.trim(),
      originalMessage: message.content,
      originalMessageId: message.id,
    });

    setFeedback(result.message);
    setReplyText({
      ...replyText,
      [message.id]: "",
    });
    refreshMessages();
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Student Messages</h2>
        <p>
          Doctors can view messages sent by students and send replies. Students
          receive replies in their inbox.
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

        {messages.length === 0 && <p>No student messages yet.</p>}

        {messages
          .slice()
          .reverse()
          .map((message) => {
            const studentCourses = getRegistrations(message.senderEmail);

            return (
              <div className="info-card" key={message.id}>
                <div className="card-title-row">
                  <h3>From: {message.sender}</h3>
                  <span className={`status-pill ${message.status === "replied" ? "done" : "open"}`}>
                    {message.status === "replied" ? "Replied" : "Open"}
                  </span>
                </div>

                <p>
                  <strong>Student Email:</strong> {message.senderEmail}
                </p>

                <p>
                  <strong>To:</strong> {message.receiver}
                </p>

                <p>
                  <strong>Message:</strong> {message.content}
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
                {message.lastReplyDate && (
                  <p className="meta">Last reply: {message.lastReplyDate}</p>
                )}

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
                />

                <button
                  className="small-action-btn"
                  onClick={() => handleReply(message)}
                >
                  Send Reply
                </button>
              </div>
            );
          })}
      </div>
    </PortalShell>
  );
}
