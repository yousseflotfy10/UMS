const PROFESSORS = [
  "Prof. Ahmed Hassan",
  "Prof. Mona Adel",
  "Prof. Karim Samir",
  "Prof. Sara Mahmoud",
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Midterm Schedule Published",
    content: "The midterm exam schedule is now available for all students.",
    date: "2026-05-04",
  },
  {
    id: 2,
    title: "Course Registration Reminder",
    content: "Students should complete course registration before the deadline.",
    date: "2026-05-02",
  },
  {
    id: 3,
    title: "Faculty Event",
    content: "The Faculty of Engineering will host a student orientation event next week.",
    date: "2026-04-29",
  },
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

  const newMessage = {
    id: Date.now(),
    ...message,
    date: new Date().toLocaleString(),
  };

  messages.push(newMessage);
  localStorage.setItem("messages", JSON.stringify(messages));

  return { success: true, message: "Message sent successfully." };
}

export function getAnnouncements() {
  const stored = localStorage.getItem("announcements");

  if (stored) {
    return JSON.parse(stored);
  }

  localStorage.setItem("announcements", JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  return DEFAULT_ANNOUNCEMENTS;
}
