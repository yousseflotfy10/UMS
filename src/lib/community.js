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

export async function getMessages(userId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Fetch all profiles to map sender and receiver names
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, name");

  const profileMap = {};
  if (profiles) {
    profiles.forEach((profile) => {
      profileMap[profile.id] = profile.name;
    });
  }

  return data.map((message) => ({
    ...message,
    sender_name: profileMap[message.sender_id] || "Unknown",
    receiver_name: profileMap[message.receiver_id] || "Unknown",
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
  });

  if (error) {
    console.error("Error sending message:", error);
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