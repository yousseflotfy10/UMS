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

export default function BookingPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classroom, setClassroom] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editClassroom, setEditClassroom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTimeSlot, setEditTimeSlot] = useState("");
  const [editPurpose, setEditPurpose] = useState("");
  const [editAvailableRooms, setEditAvailableRooms] = useState([]);

  function canManageBooking() {
    return user?.role === "admin";
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

      if (!currentUser || currentUser.role !== "admin") {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
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
      const merged = [...rooms];
      if (editClassroom && !merged.some((room) => room.name === editClassroom)) {
        merged.unshift({ id: `current-${editingId}`, name: editClassroom });
      }
      setEditAvailableRooms(merged);
    }

    updateEditAvailability();
  }, [editingId, editDate, editTimeSlot, editClassroom]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!canManageBooking()) {
      setMessage("Only admin can book classrooms.");
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
    if (!canManageBooking()) {
      setMessage("Only admin can edit classroom bookings.");
      return;
    }

    setEditingId(booking.id);
    setEditClassroom(booking.classroom || "");
    setEditDate(booking.date || "");
    setEditTimeSlot(booking.timeSlot || "");
    setEditPurpose(booking.purpose || "");
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditClassroom("");
    setEditDate("");
    setEditTimeSlot("");
    setEditPurpose("");
    setEditAvailableRooms([]);
  }

  async function handleUpdateBooking(event) {
    event.preventDefault();
    setMessage("");

    if (!canManageBooking()) {
      setMessage("Only admin can update classroom bookings.");
      return;
    }

    if (!editingId) return;

    if (!editClassroom || !editDate || !editTimeSlot || !editPurpose.trim()) {
      setMessage("Please complete all booking edit fields.");
      return;
    }

    const result = await updateClassroomBooking(editingId, {
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
    if (!canManageBooking()) {
      setMessage("Only admin can cancel classroom bookings.");
      return;
    }

    const confirmed = window.confirm("Cancel this classroom booking?");
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

  function renderBookingCard(item) {
    return (
      <div className="info-card" key={item.id}>
        <div className="card-title-row">
          <h3>{item.classroom}</h3>
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
              Cancel
            </button>
          </div>
        </div>
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
        <p>Admin can create, edit, or cancel classroom bookings.</p>
        <p className="meta">Total rooms loaded: {classrooms.length}</p>

        {message && (
          <div className={message.includes("successfully") ? "message success" : "message"}>
            {message}
          </div>
        )}

        <hr />

        <form onSubmit={handleSubmit} className="stacked-form">
          <label className="field-label">
            Date
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
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
              onChange={(event) => {
                setTimeSlot(event.target.value);
                setClassroom("");
                setMessage("");
              }}
            >
              <option value="">Select time slot</option>
              {timeSlots.map((slot) => (
                <option key={slot.id} value={slot.label}>{slot.label}</option>
              ))}
            </select>
          </label>

          {date && timeSlot && (
            <div className="availability-panel">
              <div className="card-title-row">
                <h3>Available Rooms</h3>
                <span className={availableRooms.length > 0 ? "status-pill done" : "status-pill open"}>
                  {availableRooms.length} available
                </span>
              </div>

              {availableRooms.length > 0 ? (
                <div className="room-chip-row">
                  {availableRooms.map((room) => (
                    <button
                      type="button"
                      key={room.id}
                      className={classroom === room.name ? "room-chip selected" : "room-chip"}
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
                <p className="meta">No rooms are available for this slot.</p>
              )}
            </div>
          )}

          <label className="field-label">
            Classroom
            <select
              className="form-select"
              value={classroom}
              onChange={(event) => {
                setClassroom(event.target.value);
                setMessage("");
              }}
              disabled={!date || !timeSlot || availableRooms.length === 0}
            >
              <option value="">Select available classroom</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.name}>{room.name}</option>
              ))}
            </select>
          </label>

          <textarea
            className="form-textarea"
            placeholder="Booking purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
          />

          <button
            className="primary-btn"
            type="submit"
            disabled={!date || !timeSlot || availableRooms.length === 0}
          >
            Book Classroom
          </button>
        </form>

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
            <h3>All Classroom Bookings</h3>
            {bookings.length === 0 && <p>No classroom bookings found.</p>}
            {bookings.map((item) => renderBookingCard(item))}
          </>
        )}

        {editingId && (
          <>
            <hr />
            <div className="info-card edit-panel">
              <h3>Edit Booking</h3>
              <form onSubmit={handleUpdateBooking} className="stacked-form">
                <label className="field-label">
                  Date
                  <input className="form-input" type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} />
                </label>

                <label className="field-label">
                  Time Slot
                  <select className="form-select" value={editTimeSlot} onChange={(event) => setEditTimeSlot(event.target.value)}>
                    <option value="">Select time slot</option>
                    {timeSlots.map((slot) => <option key={slot.id} value={slot.label}>{slot.label}</option>)}
                  </select>
                </label>

                <label className="field-label">
                  Classroom
                  <select className="form-select" value={editClassroom} onChange={(event) => setEditClassroom(event.target.value)}>
                    <option value="">Select classroom</option>
                    {editAvailableRooms.map((room) => <option key={room.id} value={room.name}>{room.name}</option>)}
                  </select>
                </label>

                <textarea className="form-textarea" value={editPurpose} onChange={(event) => setEditPurpose(event.target.value)} placeholder="Booking purpose" />

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
