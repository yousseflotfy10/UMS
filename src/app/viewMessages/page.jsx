"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import { getMessages, replyToMessage } from "../../lib/fakeCommunity";

export default function ViewMessagesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/signin");
      return;
    }

    setUser(currentUser);
    setMessages(getMessages());
  }, [router]);

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
    });

    setFeedback(result.message);

    setReplyText({
      ...replyText,
      [message.id]: "",
    });
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>View Student Messages</h2>
        <p>
          Professor can view student messages and send replies. Students will
          see replies in their inbox.
        </p>

        <hr />

        {feedback && (
          <div
            className={
              feedback.includes("successfully")
                ? "message success"
                : "message"
            }
          >
            {feedback}
          </div>
        )}

        {messages.length === 0 && <p>No student messages yet.</p>}

        {messages
          .slice()
          .reverse()
          .map((message) => (
            <div className="info-card" key={message.id}>
              <h3>From: {message.sender}</h3>

              <p>
                <strong>Student Email:</strong> {message.senderEmail}
              </p>

              <p>
                <strong>To:</strong> {message.receiver}
              </p>

              <p>
                <strong>Message:</strong> {message.content}
              </p>

              <p className="meta">Sent: {message.date}</p>

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
          ))}
      </div>
    </PortalShell>
  );
}