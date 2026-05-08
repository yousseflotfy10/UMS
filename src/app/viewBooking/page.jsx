"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import {
  getBookings,
  getTimeSlots,
  ensureBookingSeedData,
  updateClassroomBooking,
  cancelClassroomBooking,
  getAvailableClassrooms,
} from "../../lib/booking";
import { getCurrentAppUser } from "../../lib/auth";
import { getRegistrations, getCourses, getRegistrationStats } from "../../lib/community";

const DOCTOR_ROLES = ["professor", "doctor"];

export default function ViewBookingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editCourseId, setEditCourseId] = useState("");
  const [editClassroom, setEditClassroom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editAvailableRooms, setEditAvailableRooms] = useState([]);

  async function loadPageData(currentUser) {
    await ensureBookingSeedData();

    const allBookings = await getBookings();
    const slots = await getTimeSlots();
    const allRegistrations = await getRegistrations();
    const courses =
      currentUser?.role === "admin"
        ? await getCourses()
        : DOCTOR_ROLES.includes(currentUser?.role)
          ? await getRegistrationStats(currentUser.name)
          : [];

    const myRegistrations = allRegistrations.filter(
      (item) => item.userId === currentUser.id
    );

    const myCourseIds = new Set(
      myRegistrations.map((item) => Number(item.courseId))
    );

    const visibleBookings =
      currentUser.role === "student"
        ? allBookings.filter((booking) =>
            myCourseIds.has(Number(booking.courseId))
          )
        : allBookings;

    setBookings(visibleBookings || []);
    setRegisteredCourses(myRegistrations || []);
    setAllCourses(courses || []);
    setTimeSlots(slots || []);
  }

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      await loadPageData(currentUser);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    async function updateEditAvailability() {
      if (!editingId) return;

      const rooms =
        (await getAvailableClassrooms(editDate, editTimeSlot, editingId)) || [];
      const merged = [...rooms];

      if (editClassroom && !merged.some((room) => room.name === editClassroom)) {
        merged.unshift({ id: `current-${editingId}`, name: editClassroom });
      }

      setEditAvailableRooms(merged);
    }

    updateEditAvailability();
  }, [editingId, editDate, editTimeSlot, editClassroom]);

  function canManageBooking(booking) {
    if (!user || !booking) return false;
    if (user.role === "admin") return true;

    return (
      DOCTOR_ROLES.includes(user.role) &&
      String(booking.bookedBy || "") === String(user.id || "")
    );
  }

  const filteredBookings = useMemo(() => {
    let results = bookings;

    if (user?.role === "student") {
      if (!selectedCourseId) return [];

      results = results.filter(
        (booking) => Number(booking.courseId) === Number(selectedCourseId)
      );
    }

    if (date) {
      results = results.filter((booking) => booking.date === date);
    }

    if (timeSlot) {
      results = results.filter((booking) => booking.timeSlot === timeSlot);
    }

    return results;
  }, [bookings, user?.role, selectedCourseId, date, timeSlot]);

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
      await loadPageData(user);
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
      await loadPageData(user);
    }
  }

  function renderBookingCard(booking) {
    return (
      <div className="info-card" key={booking.id}>
        <div className="card-title-row">
          <h3>{booking.classroom}</h3>
          {canManageBooking(booking) && (
            <div className="action-row compact-actions">
              <button
                className="small-action-btn"
                type="button"
                onClick={() => startEdit(booking)}
              >
                Edit
              </button>
              <button
                className="danger-action-btn"
                type="button"
                onClick={() => handleCancelBooking(booking.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <p>
          <strong>Course:</strong> {booking.courseLabel}
        </p>
        <p>
          <strong>Date:</strong> {booking.date}
        </p>
        <p>
          <strong>Time:</strong> {booking.timeSlot}
        </p>
        <p>
          <strong>Purpose:</strong> {booking.purpose}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <PortalShell>
        <div className="content-box">
          <h2>Rooms</h2>
          <p>Loading...</p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>{user?.role === "admin" ? "Classroom Booking Management" : "Rooms"}</h2>

        {user?.role === "student" ? (
          <p>
            Select one of your registered courses to view its room bookings.
            Date and time slot are optional filters.
          </p>
        ) : user?.role === "admin" ? (
          <p>
            Admin can view, edit, and delete classroom bookings. Room availability
            updates automatically after any edit or deletion.
          </p>
        ) : (
          <p>Doctors can view classroom bookings and edit or delete only the bookings they created.</p>
        )}

        {user?.role === "student" && registeredCourses.length === 0 && (
          <p className="message">
            You are not registered in any courses yet, so no course room bookings
            are visible.
          </p>
        )}

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

        {user?.role === "student" && (
          <label className="field-label">
            Course
            <select
              className="form-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="">Select registered course</option>
              {registeredCourses.map((item) => (
                <option key={item.id} value={item.courseId}>
                  {item.courseName} ({item.courseCode})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field-label">
          Date Optional
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {date && (
            <button className="secondary-action-btn inline-clear-btn" type="button" onClick={() => setDate("")}>
              Clear date / show all dates
            </button>
          )}
        </label>

        <label className="field-label">
          Time Slot Optional
          <select
            className="form-select"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
          >
            <option value="">All time slots</option>
            {timeSlots.map((slot) => (
              <option key={slot.id} value={slot.label}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>

        <hr />

        <h3>
          {user?.role === "student"
            ? "Rooms for Selected Course"
            : "Classroom Bookings"}
        </h3>

        {user?.role === "student" && !selectedCourseId ? (
          <p>Please select a registered course first. Date and time slot are optional.</p>
        ) : filteredBookings.length === 0 ? (
          <p>No room bookings found for the selected filters.</p>
        ) : (
          filteredBookings.map((booking) => renderBookingCard(booking))
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
                    {allCourses.map((course) => (
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
