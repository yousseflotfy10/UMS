import { supabase } from "./supabase";

function cleanText(value) {
  return String(value || "").trim();
}

function cleanCode(value) {
  return cleanText(value).toUpperCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(value).toLowerCase());
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(toArray);
  if (typeof value === "number") return [String(value)];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || ["none", "n/a", "na", "-", "no prerequisites", "no prerequisite"].includes(trimmed.toLowerCase())) return [];
    return trimmed
      .split(/[;,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function mapRegistration(row) {
  return {
    id: row.id,
    userId: row.user_id || row.userId,
    courseId: row.course_id || row.courseId,
    studentName: row.student_name || row.studentName,
    studentEmail: row.student_email || row.studentEmail,
    courseName: row.course_name || row.courseName,
    courseCode: row.course_code || row.courseCode,
    status: row.status,
    date: row.created_at ? new Date(row.created_at).toLocaleString() : row.date || "",
    createdAt: row.created_at || row.createdAt || "",
  };
}

function mapMessage(row, profileMap = {}) {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    sender: row.sender_name || profileMap[row.sender_id] || "Unknown",
    receiver: row.receiver_name || profileMap[row.receiver_id] || "Unknown",
    senderEmail: row.sender_email,
    receiverEmail: row.receiver_email,
    content: row.content,
    status: row.status || "unread",
    date: row.created_at ? new Date(row.created_at).toLocaleString() : "",
    createdAt: row.created_at || "",
  };
}

function normalizeCourse(course) {
  return {
    ...course,
    code: course?.code || "",
    name: course?.name || "",
    department: course?.department || "",
    level: course?.level || "",
    credits: course?.credits || "",
    professor: course?.professor || "",
    scheduleDay: course?.scheduleDay || course?.schedule_day || course?.day || "",
    scheduleTimeSlot: course?.scheduleTimeSlot || course?.schedule_time_slot || course?.time_slot || course?.schedule || "",
    prerequisiteCodes: getPrerequisiteCodes(course),
    prerequisiteIds: getPrerequisiteIds(course),
  };
}

export function getPrerequisiteCodes(course) {
  const values = [
    ...toArray(course?.prerequisiteCodes),
    ...toArray(course?.prerequisite_codes),
    ...toArray(course?.required_course_codes),
    ...toArray(course?.prerequisites),
  ];

  return [...new Set(values.map(cleanCode).filter(Boolean))];
}

export function getPrerequisiteIds(course) {
  const values = [
    ...toArray(course?.prerequisite_course_ids),
    ...toArray(course?.required_course_ids),
    ...toArray(course?.prerequisite_ids),
  ];

  return [
    ...new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    ),
  ];
}

export function getPrerequisiteSummary(course, allCourses = []) {
  const codes = getPrerequisiteCodes(course);
  const ids = getPrerequisiteIds(course);
  const idLabels = ids.map((id) => {
    const matchedCourse = allCourses.find((item) => Number(item.id) === Number(id));
    return matchedCourse ? `${matchedCourse.code} - ${matchedCourse.name}` : `Course #${id}`;
  });

  const labels = [...codes, ...idLabels];
  return labels.length ? labels.join(", ") : "No prerequisites";
}

export function getCourseScheduleLabel(course) {
  const day = cleanText(course?.scheduleDay || course?.schedule_day || course?.day);
  const slot = cleanText(course?.scheduleTimeSlot || course?.schedule_time_slot || course?.time_slot || course?.schedule);

  if (day && slot) return `${day} · ${slot}`;
  if (day) return day;
  if (slot) return slot;
  return "Schedule not set";
}

function hasScheduleConflict(courseA, courseB) {
  const dayA = cleanText(courseA?.scheduleDay || courseA?.schedule_day).toLowerCase();
  const slotA = cleanText(courseA?.scheduleTimeSlot || courseA?.schedule_time_slot).toLowerCase();
  const dayB = cleanText(courseB?.scheduleDay || courseB?.schedule_day).toLowerCase();
  const slotB = cleanText(courseB?.scheduleTimeSlot || courseB?.schedule_time_slot).toLowerCase();

  return Boolean(dayA && slotA && dayB && slotB && dayA === dayB && slotA === slotB);
}

async function getProfileMap() {
  const { data: profiles } = await supabase.from("profiles").select("id, name");
  const profileMap = {};
  (profiles || []).forEach((profile) => {
    profileMap[profile.id] = profile.name;
  });
  return profileMap;
}

export async function getProfessors() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .in("role", ["professor", "doctor"])
    .order("name", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getCourseById(courseId) {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", Number(courseId))
    .maybeSingle();

  if (error) return null;
  return data ? normalizeCourse(data) : null;
}

export async function getMessageHistory(userId, otherUserId = "") {
  if (!userId) return [];

  let query = supabase.from("messages").select("*");

  if (otherUserId) {
    query = query.or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    );
  } else {
    query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
  }

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error || !data) return [];

  const profileMap = await getProfileMap();
  return data.map((row) => mapMessage(row, profileMap));
}

export async function getMessagesForUser(user) {
  if (!user) return [];

  const profileMap = await getProfileMap();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => mapMessage(row, profileMap));
}

export async function sendMessage(message) {
  const senderId = cleanText(message.senderId);
  const receiverId = cleanText(message.receiverId);
  const content = cleanText(message.content);

  if (!senderId || !receiverId) {
    return { success: false, message: "Please select a valid sender and receiver." };
  }

  if (!content) {
    return { success: false, message: "Message cannot be empty." };
  }

  if (content.length > 1000) {
    return { success: false, message: "Message is too long. Please keep it under 1000 characters." };
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", senderId)
    .maybeSingle();

  const { data: receiverProfile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", receiverId)
    .maybeSingle();

  if (!senderProfile || !receiverProfile) {
    return { success: false, message: "Could not find the selected user profile." };
  }

  const { error } = await supabase.from("messages").insert({
    sender_id: senderId,
    receiver_id: receiverId,
    sender_name: senderProfile.name || null,
    sender_email: senderProfile.email || null,
    receiver_name: receiverProfile.name || null,
    receiver_email: receiverProfile.email || null,
    content,
    status: "unread",
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Message sent successfully." };
}

export async function getCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (error) return [];
  return (data ?? []).map(normalizeCourse);
}

export async function getRegistrations() {
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return [];

  const { data: courses } = await supabase.from("courses").select("*");
  const courseMap = {};
  (courses || []).forEach((course) => {
    courseMap[Number(course.id)] = normalizeCourse(course);
  });

  return (data ?? []).map((row) => {
    const base = mapRegistration(row);
    const course = courseMap[Number(base.courseId)] || {};
    return {
      ...base,
      department: course.department,
      level: course.level,
      credits: course.credits,
      professor: course.professor,
      scheduleDay: course.scheduleDay,
      scheduleTimeSlot: course.scheduleTimeSlot,
    };
  });
}

export async function getProfessorRegistrations(professorName) {
  const courses = (await getCourses()).filter((course) => course.professor === professorName);
  const ids = courses.map((course) => Number(course.id));
  const all = await getRegistrations();
  return all.filter((registration) => ids.includes(Number(registration.courseId)));
}

export async function getRegistrationStats(professorName = "") {
  const courses = (await getCourses()).filter(
    (course) => !professorName || course.professor === professorName
  );

  const registrations = professorName
    ? await getProfessorRegistrations(professorName)
    : await getRegistrations();

  return courses.map((course) => ({
    ...course,
    registeredCount: registrations.filter(
      (item) => Number(item.courseId) === Number(course.id)
    ).length,
  }));
}

export async function registerCourse(user, courseId) {
  if (!user || !user.id) {
    return { success: false, message: "Student account was not found." };
  }

  if (user.role !== "student") {
    return { success: false, message: "Only students can register for courses." };
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return { success: false, message: "Course not found." };
  }

  const { data: existing } = await supabase
    .from("registrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", Number(course.id))
    .maybeSingle();

  if (existing) {
    return { success: false, message: "You are already registered in this course." };
  }

  const { data: myRegistrations, error: registrationError } = await supabase
    .from("registrations")
    .select("course_id, course_code")
    .eq("user_id", user.id);

  if (registrationError) {
    return { success: false, message: registrationError.message };
  }

  const registeredIds = new Set((myRegistrations || []).map((item) => Number(item.course_id)));
  const registeredCodes = new Set((myRegistrations || []).map((item) => cleanCode(item.course_code)));
  const prerequisiteIds = getPrerequisiteIds(course);
  const prerequisiteCodes = getPrerequisiteCodes(course);
  const allCourses = await getCourses();

  const missingIds = prerequisiteIds.filter((id) => !registeredIds.has(Number(id)));
  const missingCodes = prerequisiteCodes.filter((code) => !registeredCodes.has(cleanCode(code)));
  const missingLabels = [
    ...missingCodes,
    ...missingIds.map((id) => {
      const matchedCourse = allCourses.find((item) => Number(item.id) === Number(id));
      return matchedCourse ? `${matchedCourse.code} - ${matchedCourse.name}` : `Course #${id}`;
    }),
  ];

  if (missingLabels.length > 0) {
    return {
      success: false,
      message: `Prerequisite missing: ${missingLabels.join(", ")}. Register the prerequisite course first.`,
    };
  }

  const registeredCourseList = allCourses.filter((item) => registeredIds.has(Number(item.id)));
  const conflict = registeredCourseList.find((item) => hasScheduleConflict(course, item));

  if (conflict) {
    return {
      success: false,
      message: `Time conflict: ${course.code} overlaps with ${conflict.code} on ${getCourseScheduleLabel(course)}. Choose another course or section.`,
    };
  }

  const cleanStudentName = cleanText(user.name);
  const cleanStudentEmail = cleanText(user.email).toLowerCase();

  if (!cleanStudentName || !isValidEmail(cleanStudentEmail)) {
    return { success: false, message: "Your profile name or email is invalid. Update your profile first." };
  }

  const { error } = await supabase.from("registrations").insert({
    user_id: user.id,
    course_id: course.id,
    student_name: cleanStudentName,
    student_email: cleanStudentEmail,
    course_name: course.name,
    course_code: course.code,
    status: "registered",
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Course registered successfully." };
}

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, content, created_at")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    date: item.created_at ? new Date(item.created_at).toLocaleString() : "",
    createdAt: item.created_at || "",
  }));
}
