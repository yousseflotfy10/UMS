import { supabase } from "./supabase";

export const DEFAULT_CLASSROOMS = [
  { name: "Room A101" },
  { name: "Room A102" },
  { name: "Room B201" },
  { name: "Room B202" },
  { name: "Computer Lab 1" },
  { name: "Seminar Hall" },
];

export const DEFAULT_TIME_SLOTS = [
  { label: "08:00 AM - 10:00 AM", sort_order: 1 },
  { label: "10:00 AM - 12:00 PM", sort_order: 2 },
  { label: "12:00 PM - 02:00 PM", sort_order: 3 },
  { label: "02:00 PM - 04:00 PM", sort_order: 4 },
  { label: "04:00 PM - 06:00 PM", sort_order: 5 },
];

function normalize(value) {
  return String(value || "").trim();
}

function sortRooms(rooms = []) {
  return [...rooms].sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

function sortSlots(slots = []) {
  return [...slots].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
  );
}

function fallbackClassrooms() {
  return DEFAULT_CLASSROOMS.map((room, index) => ({
    id: `fallback-room-${index + 1}`,
    name: room.name,
    fallback: true,
  }));
}

function fallbackTimeSlots() {
  return DEFAULT_TIME_SLOTS.map((slot, index) => ({
    id: `fallback-slot-${index + 1}`,
    label: slot.label,
    sort_order: slot.sort_order,
    fallback: true,
  }));
}

async function insertMissingClassrooms(existingRooms = []) {
  const existingNames = new Set((existingRooms || []).map((room) => room.name));
  const missingRooms = DEFAULT_CLASSROOMS.filter((room) => !existingNames.has(room.name));

  if (missingRooms.length === 0) return;

  await supabase.from("classrooms").insert(missingRooms);
}

async function insertMissingTimeSlots(existingSlots = []) {
  const existingLabels = new Set((existingSlots || []).map((slot) => slot.label));
  const missingSlots = DEFAULT_TIME_SLOTS.filter((slot) => !existingLabels.has(slot.label));

  if (missingSlots.length === 0) return;

  await supabase.from("time_slots").insert(missingSlots);
}

export async function ensureBookingSeedData() {
  const { data: rooms, error: roomsError } = await supabase
    .from("classrooms")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: slots, error: slotsError } = await supabase
    .from("time_slots")
    .select("id, label, sort_order")
    .order("sort_order", { ascending: true });

  if (!roomsError && (!rooms || rooms.length === 0)) {
    await insertMissingClassrooms([]);
  }

  if (!slotsError && (!slots || slots.length === 0)) {
    await insertMissingTimeSlots([]);
  }
}

export async function getClassrooms() {
  let { data, error } = await supabase
    .from("classrooms")
    .select("id, name")
    .order("name", { ascending: true });

  if (!error && data && data.length > 0) return sortRooms(data);

  await ensureBookingSeedData();

  const retry = await supabase
    .from("classrooms")
    .select("id, name")
    .order("name", { ascending: true });

  if (!retry.error && retry.data && retry.data.length > 0) {
    return sortRooms(retry.data);
  }

  return fallbackClassrooms();
}

export async function getTimeSlots() {
  let { data, error } = await supabase
    .from("time_slots")
    .select("id, label, sort_order")
    .order("sort_order", { ascending: true });

  if (!error && data && data.length > 0) return sortSlots(data);

  await ensureBookingSeedData();

  const retry = await supabase
    .from("time_slots")
    .select("id, label, sort_order")
    .order("sort_order", { ascending: true });

  if (!retry.error && retry.data && retry.data.length > 0) {
    return sortSlots(retry.data);
  }

  return fallbackTimeSlots();
}

export async function getBookings() {
  const { data, error } = await supabase
    .from("classroom_bookings")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Could not load classroom bookings:", error);
    return [];
  }

  const courseIds = [
    ...new Set((data ?? []).map((item) => Number(item.course_id)).filter(Boolean)),
  ];

  const courseMap = {};
  if (courseIds.length > 0) {
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, name, code")
      .in("id", courseIds);

    if (!coursesError) {
      (courses || []).forEach((course) => {
        courseMap[Number(course.id)] = course;
      });
    }
  }

  return (data ?? []).map((item) => {
    const course = courseMap[Number(item.course_id)] || {};
    const courseName = course.name || item.course_name || "Course not specified";
    const courseCode = course.code || item.course_code || "";

    return {
      id: item.id,
      classroom: item.room,
      classroomId: item.classroom_id,
      date: item.date,
      timeSlot: item.time_slot,
      timeSlotId: item.time_slot_id,
      purpose: item.purpose,
      bookedBy: item.booked_by,
      courseId: item.course_id,
      courseCode,
      courseName,
      courseLabel: courseCode ? `${courseName} (${courseCode})` : courseName,
      createdAt: item.created_at || "",
    };
  });
}

export async function getAvailableClassrooms(date, timeSlot, ignoredBookingId = null) {
  const rooms = await getClassrooms();

  if (!date || !timeSlot) {
    return rooms;
  }

  const selectedDate = normalize(date);
  const selectedSlot = normalize(timeSlot);
  const bookings = await getBookings();

  const bookedRoomNames = new Set(
    bookings
      .filter(
        (booking) =>
          String(booking.id) !== String(ignoredBookingId || "") &&
          normalize(booking.date) === selectedDate &&
          normalize(booking.timeSlot) === selectedSlot
      )
      .map((booking) => normalize(booking.classroom))
  );

  return rooms.filter((room) => !bookedRoomNames.has(normalize(room.name)));
}

async function buildBookingPayload(booking, { requireCourse = false } = {}) {
  const classrooms = await getClassrooms();
  const slots = await getTimeSlots();

  const selectedRoom = classrooms.find(
    (room) => normalize(room.name) === normalize(booking.classroom)
  );
  const selectedSlot = slots.find(
    (slot) => normalize(slot.label) === normalize(booking.timeSlot)
  );

  if (!selectedRoom || !selectedSlot) {
    return { error: "Invalid classroom or time slot." };
  }

  if (requireCourse && !booking.courseId) {
    return { error: "Please select the course for this room booking." };
  }

  const selectedDate = normalize(booking.date);
  const selectedTimeSlot = normalize(booking.timeSlot);
  const selectedRoomName = normalize(booking.classroom);
  const purpose = normalize(booking.purpose);

  if (!selectedDate || !selectedTimeSlot || !selectedRoomName || !purpose) {
    return { error: "Please complete classroom, date, time slot, and purpose." };
  }

  const payload = {
    room: selectedRoomName,
    date: selectedDate,
    time_slot: selectedTimeSlot,
    purpose,
  };

  if (booking.courseId) payload.course_id = Number(booking.courseId);
  if (!selectedRoom.fallback) payload.classroom_id = selectedRoom.id;
  if (!selectedSlot.fallback) payload.time_slot_id = selectedSlot.id;

  return { payload };
}

async function hasBookingConflict({ classroom, date, timeSlot, ignoredBookingId = null }) {
  const selectedDate = normalize(date);
  const selectedTimeSlot = normalize(timeSlot);
  const selectedRoomName = normalize(classroom);
  const bookings = await getBookings();

  return bookings.some(
    (item) =>
      String(item.id) !== String(ignoredBookingId || "") &&
      normalize(item.date) === selectedDate &&
      normalize(item.timeSlot) === selectedTimeSlot &&
      normalize(item.classroom) === selectedRoomName
  );
}

export async function bookClassroom(booking, bookedBy) {
  await ensureBookingSeedData();

  const built = await buildBookingPayload(booking);
  if (built.error) return { success: false, message: built.error };

  const conflict = await hasBookingConflict({
    classroom: booking.classroom,
    date: booking.date,
    timeSlot: booking.timeSlot,
  });

  if (conflict) {
    return {
      success: false,
      message: "This classroom is already booked at this date and time slot.",
    };
  }

  const payload = {
    ...built.payload,
    booked_by: bookedBy || null,
  };

  const { error } = await supabase
    .from("classroom_bookings")
    .insert([payload]);

  if (error) {
    console.error("CLASSROOM BOOKING ERROR:", error);
    return {
      success: false,
      message: `Could not book classroom: ${error.message}`,
    };
  }


  return {
    success: true,
    message: "Classroom booked successfully.",
  };
}

export async function updateClassroomBooking(bookingId, booking) {
  if (!bookingId) {
    return { success: false, message: "Booking was not found." };
  }

  const built = await buildBookingPayload(booking);
  if (built.error) return { success: false, message: built.error };

  const conflict = await hasBookingConflict({
    classroom: booking.classroom,
    date: booking.date,
    timeSlot: booking.timeSlot,
    ignoredBookingId: bookingId,
  });

  if (conflict) {
    return {
      success: false,
      message: "Cannot update booking because this room is already booked in the selected slot.",
    };
  }

  const { error } = await supabase
    .from("classroom_bookings")
    .update(built.payload)
    .eq("id", bookingId);

  if (error) {
    return { success: false, message: `Could not update booking: ${error.message}` };
  }

  return { success: true, message: "Booking updated successfully." };
}

export async function cancelClassroomBooking(bookingId) {
  if (!bookingId) {
    return { success: false, message: "Booking was not found." };
  }

  const { error } = await supabase
    .from("classroom_bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    return { success: false, message: `Could not delete booking: ${error.message}` };
  }

  return { success: true, message: "Booking deleted successfully." };
}
