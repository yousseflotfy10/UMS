import { supabase } from "./supabase";

function mapGrade(item) {
  return {
    id: item.id,
    studentId: item.student_id,
    studentName: item.student_name,
    studentEmail: item.student_email,
    courseId: item.course_id,
    courseCode: item.course_code,
    courseName: item.course_name,
    grade: item.grade,
    feedback: item.feedback,
    uploadedBy: item.uploaded_by,
    date: item.created_at ? new Date(item.created_at).toLocaleString() : "",
  };
}

export async function getGrades() {
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapGrade);
}

export async function getGradesForStudent(user) {
  if (!user?.id) return [];

  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  if (!error && data) {
    return data.map(mapGrade);
  }

  if (!user.email) return [];

  const { data: byEmail, error: byEmailError } = await supabase
    .from("grades")
    .select("*")
    .ilike("student_email", user.email)
    .order("created_at", { ascending: false });

  if (byEmailError) return [];
  return (byEmail ?? []).map(mapGrade);
}

export async function getGradesForCourses(courseCodes = []) {
  const codes = courseCodes.filter(Boolean);
  if (codes.length === 0) return [];

  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .in("course_code", codes)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapGrade);
}

export async function uploadGrade(gradeData) {
  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", gradeData.studentEmail)
    .maybeSingle();

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("code", gradeData.courseCode)
    .maybeSingle();

  if (!studentProfile || !course) {
    return {
      success: false,
      message: "Could not match student/course for this grade.",
    };
  }

  const { data: exists } = await supabase
    .from("grades")
    .select("id")
    .eq("student_id", studentProfile.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (exists) {
    return {
      success: false,
      message: "Grade already uploaded for this student in this course.",
    };
  }

  const { error } = await supabase.from("grades").insert({
    student_id: studentProfile.id,
    course_id: course.id,
    student_name: gradeData.studentName,
    student_email: gradeData.studentEmail,
    course_name: gradeData.courseName,
    course_code: gradeData.courseCode,
    grade: gradeData.grade,
    feedback: gradeData.feedback || null,
    uploaded_by: gradeData.uploadedBy || null,
  });

  if (error) return { success: false, message: error.message };

  return {
    success: true,
    message: "Grade uploaded successfully.",
  };
}
