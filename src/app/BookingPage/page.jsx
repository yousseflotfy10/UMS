"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import {
  getClassrooms,
  getBookings,
  bookClassroom,
  getTimeSlots,
  getAvailableClassrooms,
  ensureBookingSeedData,
} from "../../lib/booking";
import { getCurrentAppUser } from "../../lib/auth";
import { getRegistrationStats } from "../../lib/community";

function canBookRooms(role) {
  return ["admin", "professor", "doctor"].includes(role);
}

function isDoctorRole(role) {
  return ["professor", "doctor"].includes(role);
}

export default function BookingPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [courseId, setCourseId] = useState("");
  const [classroom, setClassroom] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");

  const selectedCourse = useMemo(
    () => courses.find((course) => String(course.id) === String(courseId)),
    [courses, courseId]
  );

  async function refreshBookingData(nextDate = date, nextTimeSlot = timeSlot) {
    await ensureBookingSeedData();
    const rooms = await getClassrooms();
    const slots = await getTimeSlots();
    const currentBookings = await getBookings();
    const freeRooms = await getAvailableClassrooms(nextDate, nextTimeSlot);

    setClassrooms(rooms || []);
    setTimeSlots(slots || []);
    setBookings(currentBookings || []);
    setAvailableRooms(freeRooms || []);
  }

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || !canBookRooms(currentUser.role)) {
        router.push("/signin");
        return;
      }

      const visibleCourses = await getRegistrationStats(
        isDoctorRole(currentUser.role) ? currentUser.name : ""
      );

      setUser(currentUser);
      setCourses(visibleCourses || []);
      if (visibleCourses?.length) setCourseId(String(visibleCourses[0].id));

      await refreshBookingData("", "");
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    async function updateAvailability() {
      const freeRooms = (await getAvailableClassrooms(date, timeSlot)) || [];
      setAvailableRooms(freeRooms);

      setClassroom((selectedRoom) => {
        if (!selectedRoom) return selectedRoom;
        const stillAvailable = freeRooms.some((room) => room.name === selectedRoom);
        return stillAvailable ? selectedRoom : "";
      });
    }

    if (!loading) updateAvailability();
  }, [date, timeSlot, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!user || !canBookRooms(user.role)) {
      setMessage("Only admins and doctors can book classrooms.");
      return;
    }

    if (!courseId || !selectedCourse) {
      setMessage("Please select the course for this classroom booking.");
      return;
    }

    if (!date || !timeSlot) {
      setMessage("Please choose a date and time slot first.");
      return;
    }

    if (availableRooms.length === 0) {
      setMessage("No rooms are available for this date and time slot.");
      return;
    }

    if (!classroom || !purpose.trim()) {
      setMessage("Please select an available classroom and enter the booking purpose.");
      return;
    }

    const result = await bookClassroom(
      {
        classroom,
        date,
        timeSlot,
        purpose: purpose.trim(),
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        courseCode: selectedCourse.code,
      },
      user.id
    );

    setMessage(result.message);

    if (result.success) {
      await refreshBookingData(date, timeSlot);
      setClassroom("");
      setPurpose("");
    }
  }

  const selectedSlotBookings = useMemo(() => {
    if (!date || !timeSlot) return [];
    return bookings.filter(
      (booking) => booking.date === date && booking.timeSlot === timeSlot
    );
  }, [bookings, date, timeSlot]);

  const visibleCourseBookings = useMemo(() => {
    const courseIds = new Set(courses.map((course) => Number(course.id)));
    return bookings.filter((booking) => courseIds.has(Number(booking.courseId)));
  }, [bookings, courses]);

  if (loading) {
    return (
      <PortalShell>
        <div className="content-box">
          <h2>Classroom Booking</h2>
          <p>Loading...</p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Classroom Booking</h2>
        <p>
          Doctors can book an available room for one of their assigned courses.
          Students will only see room bookings for courses they are registered in.
        </p>
        <p className="meta">Total rooms loaded: {classrooms.length}</p>

        {courses.length === 0 && (
          <p className="message">
            No courses are available for your account yet. Assign a course first.
          </p>
        )}

        {classrooms.some((room) => room.fallback) && (
          <p className="message">
            Rooms are being shown from fallback data. You can still choose a room,
            but running src/supabase-room-seed.sql in Supabase is recommended.
          </p>
        )}

        <hr />

        <form onSubmit={handleSubmit}>
          <label className="field-label">
            Course
            <select
              className="form-select"
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setMessage("");
              }}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code}) · {course.registeredCount || 0} students
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Date
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setClassroom("");
                setMessage("");
              }}
            />
          </label>

          <label className="field-label">
            Time Slot
            <select
              className="form-select"
              value={timeSlot}
              onChange={(e) => {
                setTimeSlot(e.target.value);
                setClassroom("");
                setMessage("");
              }}
            >
              <option value="">Select time slot</option>
              {timeSlots.map((slot) => (
                <option key={slot.id} value={slot.label}>
                  {slot.label}
                </option>
              ))}
            </select>
          </label>

          {date && timeSlot && (
            <div className="availability-panel">
              <div className="card-title-row">
                <h3>Available Rooms</h3>
                <span
                  className={
                    availableRooms.length > 0
                      ? "status-pill done"
                      : "status-pill open"
                  }
                >
                  {availableRooms.length} available
                </span>
              </div>

              {availableRooms.length > 0 ? (
                <div className="room-chip-row">
                  {availableRooms.map((room) => (
                    <button
                      type="button"
                      key={room.id}
                      className={
                        classroom === room.name
                          ? "room-chip selected"
                          : "room-chip"
                      }
                      aria-pressed={classroom === room.name}
                      onClick={(event) => {
                        event.preventDefault();
                        setClassroom(room.name);
                        setMessage("");
                      }}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="meta">
                  No rooms are available for this slot. Choose another date or
                  time slot.
                </p>
              )}
            </div>
          )}

          <label className="field-label">
            Classroom
            <select
              className="form-select"
              value={classroom}
              onChange={(e) => {
                setClassroom(e.target.value);
                setMessage("");
              }}
              disabled={!date || !timeSlot || availableRooms.length === 0}
            >
              <option value="">Select available classroom</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.name}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>

          <textarea
            className="form-textarea"
            placeholder="Booking purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <button
            className="primary-btn"
            type="submit"
            disabled={!courseId || !date || !timeSlot || availableRooms.length === 0}
          >
            Register Classroom
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

        {date && timeSlot ? (
          <>
            <h3>Booked Rooms for Selected Slot</h3>
            {selectedSlotBookings.length === 0 ? (
              <p>No rooms are booked for this date and time slot.</p>
            ) : (
              selectedSlotBookings.map((item) => (
                <div className="info-card" key={item.id}>
                  <h3>{item.classroom}</h3>
                  <p><strong>Course:</strong> {item.courseLabel}</p>
                  <p><strong>Date:</strong> {item.date}</p>
                  <p><strong>Time:</strong> {item.timeSlot}</p>
                  <p><strong>Purpose:</strong> {item.purpose}</p>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <h3>{isDoctorRole(user?.role) ? "Your Course Room Bookings" : "All Course Room Bookings"}</h3>
            {visibleCourseBookings.length === 0 && <p>No classroom bookings found yet.</p>}
            {visibleCourseBookings.map((item) => (
              <div className="info-card" key={item.id}>
                <h3>{item.classroom}</h3>
                <p><strong>Course:</strong> {item.courseLabel}</p>
                <p><strong>Date:</strong> {item.date}</p>
                <p><strong>Time:</strong> {item.timeSlot}</p>
                <p><strong>Purpose:</strong> {item.purpose}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </PortalShell>
  );
}
