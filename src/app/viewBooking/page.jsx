"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import {
  getBookings,
  getClassrooms,
  getTimeSlots,
  ensureBookingSeedData,
  getAvailableClassrooms,
} from "../../lib/booking";
import { getCurrentAppUser } from "../../lib/auth";

export default function ViewBookingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPageData(nextDate = date, nextTimeSlot = timeSlot) {
    await ensureBookingSeedData();

    const rooms = await getClassrooms();
    const allBookings = await getBookings();
    const slots = await getTimeSlots();
    const freeRooms = await getAvailableClassrooms(nextDate, nextTimeSlot);

    setClassrooms(rooms || []);
    setBookings(allBookings || []);
    setTimeSlots(slots || []);
    setAvailableRooms(freeRooms || []);
  }

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      await loadPageData("", "");
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!loading) {
      loadPageData(date, timeSlot);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, timeSlot, loading]);

  const filteredBookings = useMemo(() => {
    let results = bookings;

    if (date) {
      results = results.filter((booking) => booking.date === date);
    }

    if (timeSlot) {
      results = results.filter((booking) => booking.timeSlot === timeSlot);
    }

    return results;
  }, [bookings, date, timeSlot]);

  if (loading) {
    return (
      <PortalShell>
        <div className="content-box">
          <h2>Room Availability</h2>
          <p>Loading...</p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Room Availability</h2>
        <p>View available classrooms and current bookings. Date and time slot filters are optional.</p>

        <p className="meta">Total rooms loaded: {classrooms.length}</p>

        <hr />

        <label className="field-label">
          Date Optional
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
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
            onChange={(event) => setTimeSlot(event.target.value)}
          >
            <option value="">All time slots</option>
            {timeSlots.map((slot) => (
              <option key={slot.id} value={slot.label}>{slot.label}</option>
            ))}
          </select>
        </label>

        <hr />

        <h3>Available Classrooms</h3>
        {availableRooms.length === 0 ? (
          <p>No rooms are available for the selected date and time slot.</p>
        ) : (
          <div className="room-chip-row">
            {availableRooms.map((room) => (
              <span className="room-chip" key={room.id}>{room.name}</span>
            ))}
          </div>
        )}

        <hr />

        <h3>Current Bookings</h3>
        {filteredBookings.length === 0 ? (
          <p>No room bookings found for the selected filters.</p>
        ) : (
          filteredBookings.map((booking) => (
            <div className="info-card" key={booking.id}>
              <h3>{booking.classroom}</h3>
              <p><strong>Date:</strong> {booking.date}</p>
              <p><strong>Time:</strong> {booking.timeSlot}</p>
              <p><strong>Purpose:</strong> {booking.purpose}</p>
            </div>
          ))
        )}
      </div>
    </PortalShell>
  );
}
