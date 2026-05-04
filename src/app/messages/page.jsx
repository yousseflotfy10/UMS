"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import { getMessages, getProfessors, getReplies, sendMessage } from "../../lib/fakeCommunity";

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
    if (!content.trim()) {
      setFeedback("Please write a message before sending.");
      return;
    }

    sendMessage({ sender: user.name, senderEmail: user.email, receiver: professor, content: content.trim() });
    setFeedback("Message sent successfully. A professor reply was added to your inbox.");
    setContent("");
    setMessages(getMessages());
    setReplies(getReplies(user.email));
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Messaging</h2>

        <form onSubmit={handleSend}>
          <select className="form-select" value={professor} onChange={(e) => setProfessor(e.target.value)}>
            {professors.map((prof) => <option key={prof} value={prof}>{prof}</option>)}
          </select>

          <textarea className="form-textarea" placeholder="Write your question..." value={content} onChange={(e) => setContent(e.target.value)} />

          <button className="primary-btn">Send Message</button>
          {feedback && <div className="message success">{feedback}</div>}
        </form>

        <div className="two-column-section">
          <section>
            <h3>Sent Messages</h3>
            {messages.length === 0 && <p>No messages sent yet.</p>}
            {messages.slice().reverse().map((msg) => (
              <div className="info-card" key={msg.id}>
                <h3>To: {msg.receiver}</h3>
                <p>{msg.content}</p>
                <p className="meta">Sent by {msg.sender} — {msg.date}</p>
              </div>
            ))}
          </section>

          <section>
            <h3>Inbox</h3>
            {replies.length === 0 && <p>No received messages yet.</p>}
            {replies.slice().reverse().map((reply) => (
              <div className="info-card" key={reply.id}>
                <h3>From: {reply.professor}</h3>
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
