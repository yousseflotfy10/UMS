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
    sender_name: row.sender_name || profileMap[row.sender_id] || "Unknown",
    receiver_name: row.receiver_name || profileMap[row.receiver_id] || "Unknown",
    senderEmail: row.sender_email,
    receiverEmail: row.receiver_email,
    content: row.content,
    status: row.status || "unread",
    date: row.created_at ? new Date(row.created_at).toLocaleString() : "",
    createdAt: row.created_at || "",
    lastReplyDate: row.updated_at ? new Date(row.updated_at).toLocaleString() : "",
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

async function getProfileMap() {
  const { data: profiles } = await supabase.from("profiles").select("id, name");
  const profileMap = {};
  (profiles || []).forEach((profile) => {
    profileMap[profile.id] = profile.name;
  });
  return profileMap;
}

export async function getMessages(userId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("sender_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const profileMap = await getProfileMap();
  return data.map((message) => mapMessage(message, profileMap));
}

export async function getInbox(userId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const profileMap = await getProfileMap();
  return data.map((message) => mapMessage(message, profileMap));
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

  let query = supabase.from("messages").select("*");
  if (user.role === "admin") {
    // Admin can review all student/professor messages.
  } else if (["professor", "doctor"].includes(user.role)) {
    query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
  } else {
    query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
  }

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error || !data) return [];

  return data.map((row) => mapMessage(row, profileMap));
}

export async function getCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("code", { ascending: true });

  if (error) return [];
  return (data ?? []).map(normalizeCourse);
}

export async function getAllRegistrations() {
  return await getRegistrations();
}

export async function getRegistrations() {
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return [];

  const { data: courses } = await supabase
    .from("courses")
    .select("*");
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

export async function getRegistrationsByCourse(courseId) {
  const all = await getRegistrations();
  return all.filter((item) => Number(item.courseId) === Number(courseId));
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

export async function replyToMessage(reply) {
  const content = cleanText(reply.content);

  if (!content) {
    return { success: false, message: "Reply cannot be empty." };
  }

  if (content.length > 1000) {
    return { success: false, message: "Reply is too long. Please keep it under 1000 characters." };
  }

  const { data: receiverProfile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("email", reply.studentEmail)
    .maybeSingle();

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("name", reply.professor)
    .in("role", ["professor", "doctor", "admin"])
    .maybeSingle();

  if (!receiverProfile || !senderProfile) {
    return { success: false, message: "Could not resolve sender/receiver for reply." };
  }

  const { error: insertError } = await supabase.from("messages").insert({
    sender_id: senderProfile.id,
    receiver_id: receiverProfile.id,
    sender_name: senderProfile.name,
    sender_email: senderProfile.email,
    receiver_name: receiverProfile.name,
    receiver_email: receiverProfile.email,
    content,
    status: "unread",
  });

  if (insertError) return { success: false, message: insertError.message };

  if (reply.originalMessageId) {
    await supabase
      .from("messages")
      .update({ status: "replied" })
      .eq("id", reply.originalMessageId);
  }

  return { success: true, message: "Reply sent successfully." };
}

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, author_name, title, content, audience, target_course_id, target_course_name, created_at")
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((item) => ({
    id: item.id,
    professor: item.author_name || "System",
    title: item.title,
    content: item.content,
    targetCourseId: item.target_course_id ? String(item.target_course_id) : "all",
    targetCourseName: item.target_course_name || "All students",
    date: item.created_at ? new Date(item.created_at).toLocaleString() : "",
  }));
}

export async function getVisibleAnnouncements(user) {
  const announcements = await getAnnouncements();
  if (!user || user.role === "admin" || ["professor", "doctor"].includes(user.role)) return announcements;

  const regs = await getRegistrations();
  const courseIds = regs
    .filter((item) => item.userId === user.id)
    .map((item) => String(item.courseId));

  return announcements.filter(
    (announcement) =>
      !announcement.targetCourseId ||
      announcement.targetCourseId === "all" ||
      courseIds.includes(String(announcement.targetCourseId))
  );
}

export async function addAnnouncement(announcement) {
  const professor = cleanText(announcement.professor);
  const title = cleanText(announcement.title);
  const content = cleanText(announcement.content);

  if (!professor || !title || !content) {
    return { success: false, message: "Please fill all announcement fields." };
  }

  let targetCourseName = "All students";
  let targetCourseId = null;

  if (announcement.targetCourseId && announcement.targetCourseId !== "all") {
    const course = await getCourseById(announcement.targetCourseId);
    targetCourseId = Number(announcement.targetCourseId);
    targetCourseName = course ? `${course.name} (${course.code})` : "Selected course";
  }

  const { data: author } = await supabase
    .from("profiles")
    .select("id")
    .eq("name", professor)
    .maybeSingle();

  const { error } = await supabase.from("announcements").insert({
    author_id: author?.id || null,
    author_name: professor,
    title,
    content,
    audience: targetCourseId ? "course" : "all",
    target_course_id: targetCourseId,
    target_course_name: targetCourseName,
  });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Announcement pushed successfully." };
}

export async function registerCourse(user, courseId) {
  if (!user || !user.id) {
    return { success: false, message: "Student account was not found." };
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

export async function dropCourse(user, courseId) {
  if (!user || !user.id) {
    return { success: false, message: "Student account was not found." };
  }

  const { error } = await supabase
    .from("registrations")
    .delete()
    .match({ user_id: user.id, course_id: Number(courseId) });

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Course removed from registrations." };
}

export async function addCourse(course) {
  const name = cleanText(course.name);
  const code = cleanCode(course.code);
  const department = cleanText(course.department);
  const level = cleanText(course.level);
  const credits = Number(course.credits);
  const professor = cleanText(course.professor) || "Not assigned";
  const scheduleDay = cleanText(course.scheduleDay);
  const scheduleTimeSlot = cleanText(course.scheduleTimeSlot);

  if (!name || !code || !department || !level || !credits || !professor) {
    return { success: false, message: "Please fill all required course fields." };
  }

  if (!Number.isFinite(credits) || credits <= 0) {
    return { success: false, message: "Credits must be a positive number." };
  }

  if ((scheduleDay && !scheduleTimeSlot) || (!scheduleDay && scheduleTimeSlot)) {
    return { success: false, message: "Please enter both schedule day and schedule time slot, or leave both empty." };
  }

  const { data: exists } = await supabase
    .from("courses")
    .select("id")
    .ilike("code", code)
    .maybeSingle();

  if (exists) {
    return { success: false, message: "Course with this code already exists." };
  }

  const { data: professorProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("name", professor)
    .in("role", ["professor", "doctor"])
    .maybeSingle();

  const prerequisiteCodes = toArray(course.prerequisiteCodes).map(cleanCode).filter(Boolean);
  const payload = {
    name,
    code,
    department,
    level,
    credits,
    professor,
    professor_id: professorProfile?.id || null,
  };

  if (prerequisiteCodes.length > 0) {
    payload.prerequisite_codes = prerequisiteCodes.join(", ");
  }

  if (scheduleDay && scheduleTimeSlot) {
    payload.schedule_day = scheduleDay;
    payload.schedule_time_slot = scheduleTimeSlot;
  }

  let { error } = await supabase.from("courses").insert(payload);

  if (error) {
    const schemaError = error.message?.toLowerCase().includes("schema") ||
      error.message?.toLowerCase().includes("column") ||
      error.message?.toLowerCase().includes("prerequisite") ||
      error.message?.toLowerCase().includes("schedule");

    if (schemaError) {
      delete payload.prerequisite_codes;
      delete payload.schedule_day;
      delete payload.schedule_time_slot;
      const retry = await supabase.from("courses").insert(payload);
      error = retry.error;
    }
  }

  if (error) return { success: false, message: error.message };
  return { success: true, message: "Course added successfully." };
}
