import { getProfessors as getProfessorUsers } from "./fakeAuth";
import { getCourseById, getRegistrations } from "./fakeCurriculum";

const FALLBACK_PROFESSORS = [
  "Prof. Ahmed Hassan",
  "Prof. Mona Adel",
  "Prof. Karim Samir",
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 1,
    professor: "System Admin",
    title: "Midterm Schedule Published",
    content: "The midterm exam schedule is now available for all students.",
    targetCourseId: "all",
    targetCourseName: "All students",
    date: "2026-05-04",
  },
  {
    id: 2,
    professor: "System Admin",
    title: "Course Registration Reminder",
    content: "Students should complete course registration before the deadline.",
    targetCourseId: "all",
    targetCourseName: "All students",
    date: "2026-05-02",
  },
];

const DEFAULT_REPLIES = [
  {
    id: 101,
    professor: "Prof. Ahmed Hassan",
    studentEmail: "all",
    content: "Please check the course material before next lecture.",
    date: "2026-05-04, 10:15 AM",
  },
];

export function getProfessors() {
  const professorUsers = getProfessorUsers().map((professor) => professor.name);
  return professorUsers.length ? professorUsers : FALLBACK_PROFESSORS;
}

export function getMessages() {
  const messages = localStorage.getItem("messages");
  return messages ? JSON.parse(messages) : [];
}

export function getMessagesForUser(user) {
  const role = user?.role || "student";
  const messages = getMessages();

  if (role === "admin") return messages;

  if (role === "professor") {
    return messages.filter((message) => message.receiver === user.name);
  }

  return messages.filter((message) => message.senderEmail === user.email);
}

export function sendMessage(message) {
  const messages = getMessages();
  const newMessage = {
    id: Date.now(),
    status: "unread",
    ...message,
    date: new Date().toLocaleString(),
  };

  messages.push(newMessage);
  localStorage.setItem("messages", JSON.stringify(messages));

  return { success: true, message: "Message sent successfully." };
}

export function getReplies(currentUserEmail) {
  const stored = localStorage.getItem("replies");
  let replies = stored ? JSON.parse(stored) : [];

  if (!stored) {
    replies = DEFAULT_REPLIES;
    localStorage.setItem("replies", JSON.stringify(replies));
  }

  return replies.filter(
    (reply) => reply.studentEmail === "all" || reply.studentEmail === currentUserEmail
  );
}

export function getAnnouncements() {
  const stored = localStorage.getItem("announcements");

  if (stored) return JSON.parse(stored);

  localStorage.setItem("announcements", JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  return DEFAULT_ANNOUNCEMENTS;
}

export function getVisibleAnnouncements(user) {
  const announcements = getAnnouncements();

  if (!user || user.role === "admin" || user.role === "professor") {
    return announcements;
  }

  const registeredCourseIds = getRegistrations(user.email).map((item) =>
    String(item.courseId)
  );

  return announcements.filter(
    (announcement) =>
      !announcement.targetCourseId ||
      announcement.targetCourseId === "all" ||
      registeredCourseIds.includes(String(announcement.targetCourseId))
  );
}

export function addAnnouncement(announcement) {
  const announcements = getAnnouncements();
  const selectedCourse =
    announcement.targetCourseId && announcement.targetCourseId !== "all"
      ? getCourseById(announcement.targetCourseId)
      : null;

  const newAnnouncement = {
    id: Date.now(),
    professor: announcement.professor,
    title: announcement.title.trim(),
    content: announcement.content.trim(),
    targetCourseId: announcement.targetCourseId || "all",
    targetCourseName: selectedCourse
      ? `${selectedCourse.name} (${selectedCourse.code})`
      : "All students",
    date: new Date().toLocaleString(),
  };

  announcements.push(newAnnouncement);
  localStorage.setItem("announcements", JSON.stringify(announcements));

  return {
    success: true,
    message: "Announcement pushed successfully.",
  };
}

export function replyToMessage(reply) {
  const stored = localStorage.getItem("replies");
  const replies = stored ? JSON.parse(stored) : DEFAULT_REPLIES;

  const newReply = {
    id: Date.now(),
    professor: reply.professor,
    studentEmail: reply.studentEmail,
    content: reply.content,
    originalMessage: reply.originalMessage,
    originalMessageId: reply.originalMessageId,
    date: new Date().toLocaleString(),
  };

  replies.push(newReply);
  localStorage.setItem("replies", JSON.stringify(replies));

  const messages = getMessages().map((message) =>
    message.id === reply.originalMessageId
      ? { ...message, status: "replied", lastReplyDate: newReply.date }
      : message
  );
  localStorage.setItem("messages", JSON.stringify(messages));

  return {
    success: true,
    message: "Reply sent successfully.",
  };
}
