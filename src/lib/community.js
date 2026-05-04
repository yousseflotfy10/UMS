import { supabase } from "../../lib/supabase";

export async function getProfessors() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("role", "professor")
    .order("name", { ascending: true });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, profiles:sender_id(name), profiles_receiver:receiver_id(name)")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((message) => ({
    ...message,
    sender_name: message.profiles?.name || "Unknown",
    receiver_name: message.profiles_receiver?.name || "Unknown",
    date: message.created_at
      ? new Date(message.created_at).toLocaleString()
      : "",
  }));
}

export async function getCourses() {
  const { data, error } = await supabase.from("courses").select("*");

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getRegistrations() {
  const { data, error } = await supabase.from("registrations").select("*");

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function sendMessage(message) {
  const { error } = await supabase.from("messages").insert({
    sender_id: message.senderId,
    receiver_id: message.receiverId,
    content: message.content,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Message sent successfully." };
}

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, content, date")
    .order("date", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}