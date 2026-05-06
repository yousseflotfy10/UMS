import { supabase } from "../../lib/supabase";

function mapRegistration(row) {
	return {
		id: row.id,
		userId: row.user_id,
		courseId: row.course_id,
		studentName: row.student_name,
		studentEmail: row.student_email,
		courseName: row.course_name,
		courseCode: row.course_code,
		status: row.status,
		date: row.created_at ? new Date(row.created_at).toLocaleString() : "",
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
		lastReplyDate: row.updated_at ? new Date(row.updated_at).toLocaleString() : "",
	};
}

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

export async function getCourseById(courseId) {
	const { data, error } = await supabase
		.from("courses")
		.select("*")
		.eq("id", Number(courseId))
		.maybeSingle();

	if (error) return null;
	return data ?? null;
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
		date: message.created_at ? new Date(message.created_at).toLocaleString() : "",
	}));
}

export async function getMessagesForUser(user) {
	if (!user) return [];

	const { data: profiles } = await supabase.from("profiles").select("id, name");
	const profileMap = {};
	if (profiles) profiles.forEach((p) => (profileMap[p.id] = p.name));

	let query = supabase.from("messages").select("*");
	if (user.role === "admin") {
		// all messages
	} else if (user.role === "professor") {
		query = query.eq("receiver_id", user.id);
	} else {
		query = query.eq("sender_id", user.id);
	}

	const { data, error } = await query.order("created_at", { ascending: false });
	if (error || !data) return [];

	return data.map((row) => mapMessage(row, profileMap));
}

export async function getInbox(userId) {
	const { data, error } = await supabase
		.from("messages")
		.select("*")
		.eq("receiver_id", userId)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching inbox messages:", error);
		return [];
	}

	if (!data) return [];

	const { data: profiles } = await supabase.from("profiles").select("id, name");
	const profileMap = {};
	if (profiles) profiles.forEach((p) => (profileMap[p.id] = p.name));

	return data.map((message) => ({
		...message,
		sender_name: profileMap[message.sender_id] || "Unknown",
		receiver_name: profileMap[message.receiver_id] || "Unknown",
		date: message.created_at ? new Date(message.created_at).toLocaleString() : "",
	}));
}

export async function getCourses() {
	const { data, error } = await supabase.from("courses").select("*");

	if (error) {
		return [];
	}

	return data ?? [];
}

export async function getAllRegistrations() {
	const rows = await getRegistrations();
	return rows;
}

export async function getRegistrations() {
	const { data, error } = await supabase
		.from("registrations")
		.select("*")
		.order("created_at", { ascending: true });

	if (error) {
		return [];
	}

	const { data: courses } = await supabase
		.from("courses")
		.select("id, department, level, credits, professor");
	const courseMap = {};
	(courses || []).forEach((course) => {
		courseMap[Number(course.id)] = course;
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
	const { data: senderProfile } = await supabase
		.from("profiles")
		.select("id, name, email")
		.eq("id", message.senderId)
		.maybeSingle();
	const { data: receiverProfile } = await supabase
		.from("profiles")
		.select("id, name, email")
		.eq("id", message.receiverId)
		.maybeSingle();

	const { error } = await supabase.from("messages").insert({
		sender_id: message.senderId,
		receiver_id: message.receiverId,
		sender_name: senderProfile?.name || null,
		sender_email: senderProfile?.email || null,
		receiver_name: receiverProfile?.name || null,
		receiver_email: receiverProfile?.email || null,
		content: message.content,
	});

	if (error) {
		console.error("Error sending message:", error);
		return { success: false, message: error.message };
	}

	return { success: true, message: "Message sent successfully." };
}

export async function replyToMessage(reply) {
	const { data: receiverProfile } = await supabase
		.from("profiles")
		.select("id, name, email")
		.eq("email", reply.studentEmail)
		.maybeSingle();

	const { data: senderProfile } = await supabase
		.from("profiles")
		.select("id, name, email")
		.eq("name", reply.professor)
		.eq("role", "professor")
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
		content: reply.content,
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

	if (error) {
		return [];
	}

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
	if (!user || user.role === "admin" || user.role === "professor") return announcements;

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
	let targetCourseName = "All students";
	let targetCourseId = null;

	if (announcement.targetCourseId && announcement.targetCourseId !== "all") {
		const course = await getCourseById(announcement.targetCourseId);
		targetCourseId = Number(announcement.targetCourseId);
		targetCourseName = course
			? `${course.name} (${course.code})`
			: "Selected course";
	}

	const { data: author } = await supabase
		.from("profiles")
		.select("id")
		.eq("name", announcement.professor)
		.maybeSingle();

	const { error } = await supabase.from("announcements").insert({
		author_id: author?.id || null,
		author_name: announcement.professor,
		title: announcement.title.trim(),
		content: announcement.content.trim(),
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

	const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
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

	const { error } = await supabase.from("registrations").insert({
		user_id: user.id,
		course_id: course.id,
		student_name: user.name,
		student_email: user.email,
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
	const { data: exists } = await supabase
		.from("courses")
		.select("id")
		.ilike("code", course.code.trim())
		.maybeSingle();

	if (exists) {
		return { success: false, message: "Course with this code already exists." };
	}

	const { data: professorProfile } = await supabase
		.from("profiles")
		.select("id")
		.eq("name", course.professor)
		.eq("role", "professor")
		.maybeSingle();

	const { error } = await supabase.from("courses").insert({
		name: course.name.trim(),
		code: course.code.trim(),
		department: course.department.trim(),
		level: String(course.level).trim(),
		credits: Number(course.credits),
		professor: course.professor || "Not assigned",
		professor_id: professorProfile?.id || null,
	});

	if (error) return { success: false, message: error.message };
	return { success: true, message: "Course added successfully." };
}
