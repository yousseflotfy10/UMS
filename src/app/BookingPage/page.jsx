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
  updateClassroomBooking,
  cancelClassroomBooking,
} from "../../lib/booking";
import { getCurrentAppUser } from "../../lib/auth";
import { getRegistrationStats, getCourses } from "../../lib/community";

const STAFF_ROLES = ["admin", "professor", "doctor"];
const DOCTOR_ROLES = ["professor", "doctor"];

export default function BookingPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [bookableCourses, setBookableCourses] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [courseId, setCourseId] = useState("");
  const [classroom, setClassroom] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editCourseId, setEditCourseId] = useState("");
  const [editClassroom, setEditClassroom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editAvailableRooms, setEditAvailableRooms] = useState([]);

  const selectedCourse = useMemo(
    () => bookableCourses.find((course) => String(course.id) === String(courseId)),
    [bookableCourses, courseId]
  );

  function canManageBooking(booking) {
    if (!user || !booking) return false;
    if (user.role === "admin") return true;

    return (
      DOCTOR_ROLES.includes(user.role) &&
      String(booking.bookedBy || "") === String(user.id || "")
    );
  }

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

      if (!currentUser || !STAFF_ROLES.includes(currentUser.role)) {
        router.push("/signin");
        return;
      }

      const courses = currentUser.role === "admin"
        ? await getCourses()
        : await getRegistrationStats(currentUser.name);

      setUser(currentUser);
      setBookableCourses(courses || []);
      if (courses?.length) setCourseId(String(courses[0].id));

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

  useEffect(() => {
    async function updateEditAvailability() {
      if (!editingId) return;
      const rooms = (await getAvailableClassrooms(editDate, editTimeSlot, editingId)) || [];
      const currentRoom = editClassroom ? [{ id: `current-${editingId}`, name: editClassroom }] : [];
      const merged = [...rooms];
      if (editClassroom && !merged.some((room) => room.name === editClassroom)) {
        merged.unshift(currentRoom[0]);
      }
      setEditAvailableRooms(merged);
    }

    updateEditAvailability();
  }, [editingId, editDate, editTimeSlot, editClassroom]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!user || !STAFF_ROLES.includes(user.role)) {
      setMessage("Only staff can book classrooms.");
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

  function startEdit(booking) {
    if (!canManageBooking(booking)) {
      setMessage("Doctors can edit only their own classroom bookings.");
      return;
    }

    setEditingId(booking.id);
    setEditCourseId(String(booking.courseId || ""));
    setEditClassroom(booking.classroom || "");
    setEditDate(booking.date || "");
    setEditTimeSlot(booking.timeSlot || "");
    setEditPurpose(booking.purpose || "");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditCourseId("");
    setEditClassroom("");
    setEditDate("");
    setEditTimeSlot("");
    setEditPurpose("");
    setEditAvailableRooms([]);
  }

  async function handleUpdateBooking(e) {
    e.preventDefault();
    setMessage("");

    const bookingToUpdate = bookings.find(
      (booking) => String(booking.id) === String(editingId)
    );

    if (!canManageBooking(bookingToUpdate)) {
      setMessage("Doctors can edit only their own classroom bookings.");
      return;
    }

    if (!editingId) return;

    if (!editCourseId || !editClassroom || !editDate || !editTimeSlot || !editPurpose.trim()) {
      setMessage("Please complete all booking edit fields.");
      return;
    }

    const result = await updateClassroomBooking(editingId, {
      courseId: editCourseId,
      classroom: editClassroom,
      date: editDate,
      timeSlot: editTimeSlot,
      purpose: editPurpose.trim(),
    });

    setMessage(result.message);

    if (result.success) {
      cancelEdit();
      await refreshBookingData(date, timeSlot);
    }
  }

  async function handleCancelBooking(bookingId) {
    const bookingToDelete = bookings.find(
      (booking) => String(booking.id) === String(bookingId)
    );

    if (!canManageBooking(bookingToDelete)) {
      setMessage("Doctors can delete only their own classroom bookings.");
      return;
    }

    const confirmed = window.confirm("Delete this classroom booking?");
    if (!confirmed) return;

    const result = await cancelClassroomBooking(bookingId);
    setMessage(result.message);

    if (result.success) {
      if (editingId === bookingId) cancelEdit();
      await refreshBookingData(date, timeSlot);
    }
  }

  const selectedSlotBookings = useMemo(() => {
    if (!date || !timeSlot) return [];
    return bookings.filter(
      (booking) => booking.date === date && booking.timeSlot === timeSlot
    );
  }, [bookings, date, timeSlot]);

  const visibleBookings = useMemo(() => {
    if (user?.role === "admin") return bookings;
    const doctorCourseIds = new Set(bookableCourses.map((course) => Number(course.id)));
    return bookings.filter((booking) => doctorCourseIds.has(Number(booking.courseId)));
  }, [bookings, bookableCourses, user?.role]);


  function renderBookingCard(item) {
    return (
      <div className="info-card" key={item.id}>
        <div className="card-title-row">
          <h3>{item.classroom}</h3>
          {canManageBooking(item) && (
            <div className="action-row compact-actions">
              <button
                className="small-action-btn"
                type="button"
                onClick={() => startEdit(item)}
              >
                Edit
              </button>
              <button
                className="danger-action-btn"
                type="button"
                onClick={() => handleCancelBooking(item.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <p><strong>Course:</strong> {item.courseLabel}</p>
        <p><strong>Date:</strong> {item.date}</p>
        <p><strong>Time:</strong> {item.timeSlot}</p>
        <p><strong>Purpose:</strong> {item.purpose}</p>
      </div>
    );
  }

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
          Doctors can book an available room for assigned courses, then edit or delete
          their own bookings. Admins can manage every booking.
        </p>
        <p className="meta">Total rooms loaded: {classrooms.length}</p>

        {bookableCourses.length === 0 && (
          <p className="message">
            No courses are available for this account yet. Add or assign a course first.
          </p>
        )}

        {classrooms.some((room) => room.fallback) && (
          <p className="message">
            Rooms are being shown from fallback data. You can still choose and book a room, but running the Supabase seed file is recommended.
          </p>
        )}

        <hr />

        <form onSubmit={handleSubmit} className="stacked-form">
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
              {bookableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code}) {course.registeredCount !== undefined ? `· ${course.registeredCount || 0} students` : ""}
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
              selectedSlotBookings.map((item) => renderBookingCard(item))
            )}
          </>
        ) : (
          <>
            <h3>{user?.role === "admin" ? "All Room Bookings" : "Your Course Room Bookings"}</h3>
            {visibleBookings.length === 0 && <p>No classroom bookings found.</p>}
            {visibleBookings.map((item) => renderBookingCard(item))}
          </>
        )}

        {editingId && canManageBooking(bookings.find((booking) => String(booking.id) === String(editingId))) && (
          <>
            <hr />
            <div className="info-card edit-panel">
              <h3>Edit Booking</h3>
              <form onSubmit={handleUpdateBooking} className="stacked-form">
                <label className="field-label">
                  Course
                  <select className="form-select" value={editCourseId} onChange={(e) => setEditCourseId(e.target.value)}>
                    <option value="">Select course</option>
                    {bookableCourses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                    ))}
                  </select>
                </label>

                <label className="field-label">
                  Date
                  <input className="form-input" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </label>

                <label className="field-label">
                  Time Slot
                  <select className="form-select" value={editTimeSlot} onChange={(e) => setEditTimeSlot(e.target.value)}>
                    <option value="">Select time slot</option>
                    {timeSlots.map((slot) => <option key={slot.id} value={slot.label}>{slot.label}</option>)}
                  </select>
                </label>

                <label className="field-label">
                  Classroom
                  <select className="form-select" value={editClassroom} onChange={(e) => setEditClassroom(e.target.value)}>
                    <option value="">Select classroom</option>
                    {editAvailableRooms.map((room) => <option key={room.id} value={room.name}>{room.name}</option>)}
                  </select>
                </label>

                <textarea className="form-textarea" value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} placeholder="Booking purpose" />

                <div className="action-row">
                  <button className="small-action-btn" type="submit">Save Changes</button>
                  <button className="secondary-action-btn" type="button" onClick={cancelEdit}>Close Edit</button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
