"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import {
  getBookings,
  getTimeSlots,
  ensureBookingSeedData,
} from "../../lib/booking";
import { getCurrentAppUser } from "../../lib/auth";
import { getRegistrations } from "../../lib/community";

export default function ViewBookingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }

      await ensureBookingSeedData();

      const allBookings = await getBookings();
      const slots = await getTimeSlots();
      const allRegistrations = await getRegistrations();
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

      setUser(currentUser);
      setBookings(visibleBookings || []);
      setRegisteredCourses(myRegistrations || []);
      setTimeSlots(slots || []);
      setLoading(false);
    }

    init();
  }, [router]);

  const filteredBookings = useMemo(() => {
    let results = bookings;

    if (user?.role === "student") {
      if (!selectedCourseId) return [];

      results = results.filter(
        (booking) => Number(booking.courseId) === Number(selectedCourseId)
      );
    }

    // Date is optional. Only filter by date when the student chooses a date.
    if (date) {
      results = results.filter((booking) => booking.date === date);
    }

    // Time slot is optional. Only filter by time slot when the student chooses one.
    if (timeSlot) {
      results = results.filter((booking) => booking.timeSlot === timeSlot);
    }

    return results;
  }, [bookings, user?.role, selectedCourseId, date, timeSlot]);

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
        <h2>Rooms</h2>

        {user?.role === "student" ? (
          <p>
            Select one of your registered courses first. Date and time slot are
            both optional filters, so you can leave them empty to view all room
            bookings for that course.
          </p>
        ) : (
          <p>Staff can view all classroom bookings.</p>
        )}

        {user?.role === "student" && registeredCourses.length === 0 && (
          <p className="message">
            You are not registered in any courses yet, so no course room bookings
            are visible.
          </p>
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
        </label>
        {date && (
          <button
            type="button"
            className="small-action-btn clear-filter-btn"
            onClick={() => setDate("")}
          >
            Clear date / show all dates
          </button>
        )}

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

        <p className="meta">
          Leave Date Optional empty to show all dates. Leave Time Slot Optional
          on All time slots to show every slot.
        </p>

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
          filteredBookings.map((booking) => (
            <div className="info-card" key={booking.id}>
              <h3>{booking.classroom}</h3>
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
          ))
        )}
      </div>
    </PortalShell>
  );
}
