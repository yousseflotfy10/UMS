const DEFAULT_CLASSROOMS = [
  "Room 101",
  "Room 102",
  "Room 201",
  "Lab 1",
  "Lab 2",
];

const DEFAULT_BOOKINGS = [
  {
    id: 1,
    classroom: "Room 101",
    date: "2026-05-10",
    timeSlot: "10:00 - 12:00",
    purpose: "Database Lecture",
  },
];

export function getClassrooms() {
  return DEFAULT_CLASSROOMS;
}

export function getBookings() {
  const stored = localStorage.getItem("bookings");

  if (stored) {
    return JSON.parse(stored);
  }

  localStorage.setItem("bookings", JSON.stringify(DEFAULT_BOOKINGS));
  return DEFAULT_BOOKINGS;
}

export function bookClassroom(booking) {
  const bookings = getBookings();

  const conflict = bookings.find(
    (item) =>
      item.classroom === booking.classroom &&
      item.date === booking.date &&
      item.timeSlot === booking.timeSlot
  );

  if (conflict) {
    return {
      success: false,
      message: "This classroom is already booked at this time.",
    };
  }

  const newBooking = {
    id: Date.now(),
    ...booking,
  };

  bookings.push(newBooking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  return {
    success: true,
    message: "Classroom booked successfully.",
  };
}