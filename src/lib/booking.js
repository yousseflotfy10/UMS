import { supabase } from "../../lib/supabase";

export async function getClassrooms() {
  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getTimeSlots() {
  const { data, error } = await supabase
    .from("time_slots")
    .select("id, label")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getBookings() {
  const { data, error } = await supabase
    .from("classroom_bookings")
    .select("*")
    .order("date", { ascending: true });

  if (error) return [];

  return (data ?? []).map((item) => ({
    id: item.id,
    classroom: item.room,
    classroomId: item.classroom_id,
    date: item.date,
    timeSlot: item.time_slot,
    timeSlotId: item.time_slot_id,
    purpose: item.purpose,
  }));
}

export async function bookClassroom(booking, bookedBy) {
  const classrooms = await getClassrooms();
  const slots = await getTimeSlots();

  const selectedRoom = classrooms.find((room) => room.name === booking.classroom);
  const selectedSlot = slots.find((slot) => slot.label === booking.timeSlot);

  if (!selectedRoom || !selectedSlot) {
    return { success: false, message: "Invalid classroom or time slot." };
  }

  const { data: conflict } = await supabase
    .from("classroom_bookings")
    .select("id")
    .eq("classroom_id", selectedRoom.id)
    .eq("date", booking.date)
    .eq("time_slot_id", selectedSlot.id)
    .maybeSingle();

  if (conflict) {
    return {
      success: false,
      message: "This classroom is already booked at this time.",
    };
  }

  const { error } = await supabase.from("classroom_bookings").insert({
    room: booking.classroom,
    classroom_id: selectedRoom.id,
    date: booking.date,
    time_slot: booking.timeSlot,
    time_slot_id: selectedSlot.id,
    booked_by: bookedBy || null,
    purpose: booking.purpose,
  });

  if (error) return { success: false, message: error.message };

  return {
    success: true,
    message: "Classroom booked successfully.",
  };
}
