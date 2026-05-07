import { supabase } from "./supabase";

export async function registerUser(newUser) {
  const normalizedEmail = String(newUser.email || "").trim().toLowerCase();

  if (!newUser.name?.trim() || !normalizedEmail || !newUser.password) {
    return { success: false, message: "Please fill all required fields." };
  }

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (existingProfile) {
    return { success: false, message: "An account with this email already exists." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: newUser.password,
    options: {
      data: {
        full_name: newUser.name.trim(),
      },
    },
  });

  if (error) {
    const duplicate = error.message?.toLowerCase().includes("already");
    return {
      success: false,
      message: duplicate ? "An account with this email already exists." : error.message,
    };
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        name: newUser.name.trim(),
        email: normalizedEmail,
        role: "student",
        student_id: newUser.studentId || null,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return { success: false, message: profileError.message };
    }
  }

  return {
    success: true,
    message: "Account created successfully.",
    user: data.user,
  };
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim().toLowerCase(),
    password,
  });

  if (error || !data?.user) {
    return { success: false, message: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role, student_id")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    success: true,
    user: {
      id: data.user.id,
      email: profile?.email || data.user.email,
      name: profile?.name || data.user.user_metadata?.full_name || "User",
      role: profile?.role || "student",
      student_id: profile?.student_id || null,
    },
  };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) return null;
  return data.user;
}

export async function getCurrentProfile() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, student_id")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data ?? null;
}

export async function getCurrentAppUser() {
  const authUser = await getCurrentUser();
  if (!authUser) return null;

  const profile = await getCurrentProfile();
  if (!profile) {
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || "User",
      role: "student",
      student_id: null,
    };
  }

  return {
    id: authUser.id,
    email: profile.email || authUser.email,
    name: profile.name,
    role: profile.role,
    student_id: profile.student_id || null,
  };
}

export async function getStudents() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, student_id")
    .eq("role", "student")
    .order("name", { ascending: true });

  if (error) return [];
  return data ?? [];
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
