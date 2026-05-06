"use client";

import { useEffect, useState } from "react";
import PortalShell from "../../components/PortalShell";
import { getClassrooms, getBookings } from "../../lib/fakeBooking";

export default function ViewBookingPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    setClassrooms(getClassrooms());
    setBookings(getBookings());
  }, []);

  function isRoomBooked(room) {
    return bookings.some((booking) => booking.classroom === room);
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Available Classrooms</h2>
        <p>
          Users can view classroom availability before selecting a suitable room.
        </p>

        <hr />

        {classrooms.map((room) => {
          const roomBookings = bookings.filter(
            (booking) => booking.classroom === room
          );

          return (
            <div className="info-card" key={room}>
              <h3>{room}</h3>

              {!isRoomBooked(room) ? (
                <p className="meta">Status: Available</p>
              ) : (
                <>
                  <p className="meta">Status: Partially booked</p>

                  <p>
                    <strong>Booked Time Slots:</strong>
                  </p>

                  {roomBookings.map((booking) => (
                    <p key={booking.id}>
                      {booking.date} | {booking.timeSlot} | {booking.purpose}
                    </p>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </PortalShell>
  );
}