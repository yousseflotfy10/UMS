"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import {
  getAnnouncements,
  getProfessors,
  addAnnouncement,
} from "../../lib/fakeCommunity";
import { getCourses, getRegistrationStats } from "../../lib/fakeCurriculum";

export default function AddAnnouncementsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [professors, setProfessors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [professor, setProfessor] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || !["admin", "professor"].includes(currentUser.role)) {
      router.push("/signin");
      return;
    }

    const visibleCourses =
      currentUser.role === "professor"
        ? getRegistrationStats(currentUser.name)
        : getCourses();

    setUser(currentUser);
    setProfessors(getProfessors());
    setProfessor(currentUser.role === "professor" ? currentUser.name : "");
    setCourses(visibleCourses);
    setAnnouncements(
      getAnnouncements().sort((a, b) => new Date(b.date) - new Date(a.date))
    );
  }, [router]);

  function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!professor || !title.trim() || !content.trim()) {
      setMessage("Please fill all fields.");
      return;
    }

    const result = addAnnouncement({
      professor,
      title,
      content,
      targetCourseId,
    });

    setMessage(result.message);

    if (result.success) {
      setAnnouncements(
        getAnnouncements().sort((a, b) => new Date(b.date) - new Date(a.date))
      );

      if (user?.role === "admin") setProfessor("");
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
          {user?.role === "admin" ? (
            <select
              className="form-select"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
            >
              <option value="">Select doctor</option>
              <option value="System Admin">System Admin</option>
              {professors.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
            </select>
          ) : (
            <input className="form-input" value={professor} disabled />
          )}

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
