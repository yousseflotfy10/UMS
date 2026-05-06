"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import {
  getAnnouncements,
  getProfessors,
  addAnnouncement,
} from "../../lib/fakeCommunity";

export default function AddAnnouncementsPage() {
  const [professors, setProfessors] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [professor, setProfessor] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setProfessors(getProfessors());
    setAnnouncements(
      getAnnouncements().sort((a, b) => new Date(b.date) - new Date(a.date))
    );
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    if (!professor || !title || !content) {
      setMessage("Please fill all fields.");
      return;
    }

    const result = addAnnouncement({
      professor,
      title,
      content,
    });

    setMessage(result.message);

    if (result.success) {
      setAnnouncements(
        getAnnouncements().sort((a, b) => new Date(b.date) - new Date(a.date))
      );

      setProfessor("");
      setTitle("");
      setContent("");
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Add Announcement</h2>
        <p>
          Professor can add announcements so students can stay informed about
          courses, exams, and important updates.
        </p>

        <hr />

        <form onSubmit={handleSubmit}>
          <select
            className="form-select"
            value={professor}
            onChange={(e) => setProfessor(e.target.value)}
          >
            <option value="">Select professor</option>
            {professors.map((prof) => (
              <option key={prof} value={prof}>
                {prof}
              </option>
            ))}
          </select>

          <input
            className="form-input"
            type="text"
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="form-textarea"
            placeholder="Announcement content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button className="primary-btn" type="submit">
            Add Announcement
          </button>
        </form>

        {message && (
          <div
            className={
              message.includes("successfully") ? "message success" : "message"
            }
          >
            {message}
          </div>
        )}

        <hr />

        <h3>All Announcements</h3>

        {announcements.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.content}</p>
            {item.professor && (
              <p>
                <strong>Added by:</strong> {item.professor}
              </p>
            )}
            <p className="meta">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}