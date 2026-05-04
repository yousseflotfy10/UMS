"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../lib/fakeAuth";
import {
  getMessages,
  getProfessors,
  getReplies,
  sendMessage,
} from "../../lib/fakeCommunity";

export default function MessagesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [professor, setProfessor] = useState("");
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [replies, setReplies] = useState([]);
  const [feedback, setFeedback] = useState("");

  const professors = getProfessors();

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      router.push("/signin");
      return;
    }

    setUser(currentUser);
    setProfessor(professors[0]);
    setMessages(getMessages());
    setReplies(getReplies(currentUser.email));
  }, [router]);

  function handleSend(event) {
    event.preventDefault();
    setFeedback("");

    if (!content.trim()) {
      setFeedback("Please write a message before sending.");
      return;
    }

    const result = sendMessage({
      sender: user.name,
      senderEmail: user.email,
      receiver: professor,
      content: content.trim(),
    });

    if (result.success) {
      setFeedback("Message sent successfully. A professor reply was added to your inbox.");
      setContent("");
      setMessages(getMessages());
      setReplies(getReplies(user.email));
    }
  }

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
            <h2>Messaging</h2>

            <form onSubmit={handleSend}>
              <select
                className="form-select"
                value={professor}
                onChange={(event) => setProfessor(event.target.value)}
              >
                {professors.map((prof) => (
                  <option key={prof} value={prof}>
                    {prof}
                  </option>
                ))}
              </select>

              <textarea
                className="form-textarea"
                placeholder="Write your question to the professor..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />

              <button className="primary-btn">Send Message</button>

              {feedback && <div className="message success">{feedback}</div>}
            </form>

            <div className="two-column-section">
              <section>
                <h3 className="section-title-small">Sent Messages</h3>

                <div className="card-list">
                  {messages.length === 0 && <p>No messages sent yet.</p>}

                  {messages
                    .slice()
                    .reverse()
                    .map((msg) => (
                      <div className="info-card" key={msg.id}>
                        <h3>To: {msg.receiver}</h3>
                        <p>{msg.content}</p>
                        <p className="meta">
                          Sent by {msg.sender} — {msg.date}
                        </p>
                      </div>
                    ))}
                </div>
              </section>

              <section>
                <h3 className="section-title-small">Inbox / Received Messages</h3>

                <div className="card-list">
                  {replies.length === 0 && <p>No received messages yet.</p>}

                  {replies
                    .slice()
                    .reverse()
                    .map((reply) => (
                      <div className="info-card" key={reply.id}>
                        <h3>From: {reply.professor}</h3>
                        <p>{reply.content}</p>

                        {reply.originalMessage && (
                          <div className="reply-box">
                            <strong>Your message:</strong>
                            <p>{reply.originalMessage}</p>
                          </div>
                        )}

                        <p className="meta">Received: {reply.date}</p>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
