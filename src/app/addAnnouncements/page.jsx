"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import {
  getAnnouncements,
  addAnnouncement,
  getRegistrationStats,
} from "../../lib/community";

const DOCTOR_ROLES = ["professor", "doctor"];

export default function AddAnnouncementsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [professor, setProfessor] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || !DOCTOR_ROLES.includes(currentUser.role)) {
        router.push("/signin");
        return;
      }

      const visibleCourses = await getRegistrationStats(currentUser.name);

      setUser(currentUser);
      setProfessor(currentUser.name);
      setCourses(visibleCourses);
      setAnnouncements(
        (await getAnnouncements()).sort((a, b) => new Date(b.date) - new Date(a.date))
      );
    }

    init();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!professor || !title.trim() || !content.trim()) {
      setMessage("Please fill all fields.");
      return;
    }

    const result = await addAnnouncement({
      professor,
      title,
      content,
      targetCourseId,
    });

    setMessage(result.message);

    if (result.success) {
      setAnnouncements(
        (await getAnnouncements()).sort((a, b) => new Date(b.date) - new Date(a.date))
      );
      setTargetCourseId("all");
      setTitle("");
      setContent("");
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Push Announcement</h2>
        <p>
          Doctors can push announcements to all students or to students
          registered in a specific course.
        </p>

        <hr />

        <form onSubmit={handleSubmit}>
          <input className="form-input" value={professor} disabled />

          <select
            className="form-select"
            value={targetCourseId}
            onChange={(e) => setTargetCourseId(e.target.value)}
          >
            <option value="all">All students</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} ({course.code})
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
            Push Announcement
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
            <p>
              <strong>Added by:</strong> {item.professor || "System"}
            </p>
            <p>
              <strong>Audience:</strong> {item.targetCourseName || "All students"}
            </p>
            <p className="meta">Date: {item.date}</p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
