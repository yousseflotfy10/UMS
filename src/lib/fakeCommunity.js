const PROFESSORS = ["Prof. Ahmed Hassan", "Prof. Mona Adel", "Prof. Karim Samir"];

const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, title: "Midterm Schedule Published", content: "The midterm exam schedule is now available for all students.", date: "2026-05-04" },
  { id: 2, title: "Course Registration Reminder", content: "Students should complete course registration before the deadline.", date: "2026-05-02" },
];

const DEFAULT_REPLIES = [
  { id: 101, professor: "Prof. Ahmed Hassan", studentEmail: "all", content: "Please check the course material before next lecture.", date: "2026-05-04, 10:15 AM" },
];

export function getProfessors() {
  return PROFESSORS;
}

export function getMessages() {
  const messages = localStorage.getItem("messages");
  return messages ? JSON.parse(messages) : [];
}

export function sendMessage(message) {
  const messages = getMessages();
  const newMessage = { id: Date.now(), ...message, date: new Date().toLocaleString() };
  messages.push(newMessage);
  localStorage.setItem("messages", JSON.stringify(messages));
  createProfessorReply(newMessage);
  return { success: true, message: "Message sent successfully." };
}

export function getReplies(currentUserEmail) {
  const stored = localStorage.getItem("replies");
  let replies = stored ? JSON.parse(stored) : [];
  if (!stored) {
    replies = DEFAULT_REPLIES;
    localStorage.setItem("replies", JSON.stringify(replies));
  }
  return replies.filter((reply) => reply.studentEmail === "all" || reply.studentEmail === currentUserEmail);
}

function createProfessorReply(originalMessage) {
  const stored = localStorage.getItem("replies");
  const replies = stored ? JSON.parse(stored) : DEFAULT_REPLIES;
  replies.push({
    id: Date.now() + 1,
    professor: originalMessage.receiver,
    studentEmail: originalMessage.senderEmail,
    content: "Thank you for your message. I received your question and will follow up during office hours.",
    originalMessage: originalMessage.content,
    date: new Date().toLocaleString(),
  });
  localStorage.setItem("replies", JSON.stringify(replies));
}

export function getAnnouncements() {
  const stored = localStorage.getItem("announcements");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("announcements", JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  return DEFAULT_ANNOUNCEMENTS;
}
