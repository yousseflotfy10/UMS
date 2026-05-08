"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser, getCurrentProfile } from "../../lib/auth";
import {
  getMessageHistory,
  getProfessors,
  sendMessage,
} from "../../lib/community";

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [professor, setProfessor] = useState("");
  const [content, setContent] = useState("");
  const [history, setHistory] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [feedback, setFeedback] = useState("");

  async function loadHistory(currentUser = user, selectedProfessor = professor) {
    if (!currentUser?.id) return;
    const messages = await getMessageHistory(currentUser.id, selectedProfessor);
    setHistory(messages || []);
  }

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

      const currentUser = {
        id: authUser.id,
        name: profile.name,
        email: authUser.email,
        role: profile.role,
      };

      const profs = await getProfessors();
      const firstProfessorId = profs[0]?.id ?? "";

      setUser(currentUser);
      setProfessors(profs);
      setProfessor(firstProfessorId);

      const messages = await getMessageHistory(currentUser.id, firstProfessorId);
      setHistory(messages || []);
    }

    init();
  }, [router]);

  async function handleProfessorChange(value) {
    setProfessor(value);
    setFeedback("");
    await loadHistory(user, value);
  }

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

    if (result.success) {
      setContent("");
      await loadHistory(user, professor);
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Messaging</h2>
        <p>Send questions to your professor and track the full message history.</p>

        <form onSubmit={handleSend} className="stacked-form">
          <label className="field-label">
            Professor
            <select
              className="form-select"
              value={professor}
              onChange={(e) => handleProfessorChange(e.target.value)}
            >
              {professors.length === 0 && <option value="">No professors found</option>}
              {professors.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </label>

          <textarea
            className="form-textarea"
            placeholder="Write your question..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
          />

          <button className="primary-btn" type="submit">
            Send Message
          </button>
          {feedback && (
            <div className={feedback.includes("successfully") ? "message success" : "message"}>
              {feedback}
            </div>
          )}
        </form>

        <hr />

        <div className="card-title-row">
          <h3>Message History</h3>
          <span className="status-pill done">{history.length} messages</span>
        </div>

        {history.length === 0 ? (
          <p>No previous messages with this professor yet.</p>
        ) : (
          <div className="history-list">
            {history.map((msg) => {
              const sentByMe = msg.senderId === user?.id;
              return (
                <div
                  className={sentByMe ? "message-bubble mine" : "message-bubble theirs"}
                  key={msg.id}
                >
                  <div className="message-bubble-head">
                    <strong>{sentByMe ? "You" : msg.sender}</strong>
                    <span>{msg.date}</span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
