"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import { getMessages, getProfessors, sendMessage } from "../../lib/community";

export default function MessagesPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [professor, setProfessor] = useState("");
  const [professors, setProfessors] = useState([]);
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const currentUser = await getCurrentUser();
      const professorRows = await getProfessors();

      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      setProfessors(professorRows);
      if (professorRows.length > 0) {
        setProfessor(professorRows[0].id);
      }
      setMessages(await getMessages());
      setIsLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSend(event) {
    event.preventDefault();
    setFeedback("");

    if (!content.trim()) {
      setFeedback("Please write a message before sending.");
      return;
    }

    if (!user) {
      setFeedback("Please sign in again.");
      return;
    }

    if (!professor) {
      setFeedback("Please select a professor.");
      return;
    }

    const result = await sendMessage({
      senderId: user.id,
      receiverId: professor,
      content: content.trim(),
    });

    if (result.success) {
      setFeedback("Message sent successfully.");
      setContent("");
      setMessages(await getMessages());
      return;
    }

    setFeedback(result.message);
  }

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>Ain Shams University - Faculty of Engineering</h1>
        </header>

        <nav className="portal-tabs">
          <a href="/messages">Messages</a>
        </nav>

        <div className="portal-content">
          <div className="content-box">
            <h2>Messaging</h2>

            {isLoading && <p>Loading messages...</p>}

            <form onSubmit={handleSend}>
              <select
                className="form-select"
                value={professor}
                onChange={(event) => setProfessor(event.target.value)}
                disabled={isLoading || professors.length === 0}
              >
                <option value="" disabled>
                  {isLoading ? "Loading professors..." : "Select professor"}
                </option>

                {professors.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
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

            <hr />

            <h3>Sent Messages</h3>

            <div className="card-list">
              {messages.length === 0 && <p>No messages sent yet.</p>}

              {messages.map((msg) => (
                  <div className="info-card" key={msg.id}>
                    <h3>To: {msg.receiver_name}</h3>
                    <p>{msg.content}</p>
                    <p className="meta">
                      Sent by {msg.sender_name} — {msg.date}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
