"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import {
  getClassrooms,
  getBookings,
  bookClassroom,
  getTimeSlots,
} from "../../lib/booking";
import { getCurrentAppUser } from "../../lib/auth";

export default function BookingPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);

  const [classroom, setClassroom] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      setUser(await getCurrentAppUser());
      const rooms = await getClassrooms();
      setClassrooms((rooms || []).map((room) => room.name));
      setBookings(await getBookings());
      setTimeSlots(await getTimeSlots());
    }
    init();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!classroom || !date || !timeSlot || !purpose) {
      setMessage("Please fill all fields.");
      return;
    }

    const result = await bookClassroom({
      classroom,
      date,
      timeSlot,
      purpose,
    }, user?.id);

    setMessage(result.message);

    if (result.success) {
      setBookings(await getBookings());
      setClassroom("");
      setDate("");
      setTimeSlot("");
      setPurpose("");
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Classroom Booking</h2>
        <p>
          Admin can book classrooms by choosing the classroom, date, time slot,
          and purpose.
        </p>

        <hr />

        <form onSubmit={handleSubmit}>
          <select
            className="form-select"
            value={classroom}
            onChange={(e) => setClassroom(e.target.value)}
          >
            <option value="">Select classroom</option>
            {classrooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>

          <input
            className="form-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="form-select"
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
          >
            <option value="">Select time slot</option>
            {timeSlots.map((slot) => (
              <option key={slot.id} value={slot.label}>
                {slot.label}
              </option>
            ))}
          </select>

          <textarea
            className="form-textarea"
            placeholder="Booking purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <button className="primary-btn" type="submit">
            Book Classroom
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

        <h3>Current Bookings</h3>

        {bookings.map((item) => (
          <div className="info-card" key={item.id}>
            <h3>{item.classroom}</h3>
            <p>
              <strong>Date:</strong> {item.date}
            </p>
            <p>
              <strong>Time:</strong> {item.timeSlot}
            </p>
            <p>
              <strong>Purpose:</strong> {item.purpose}
            </p>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}