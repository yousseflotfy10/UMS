import { supabase } from "../../lib/supabase";

export async function registerUser(newUser) {
  const { data, error } = await supabase.auth.signUp({
    email: newUser.email,
    password: newUser.password,
    options: {
      data: {
        full_name: newUser.name,
      },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  if (data.user) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        name: newUser.name,
        role: "student",
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
    email,
    password,
  });

  if (error) {
    return { success: false, message: "Invalid email or password." };
  }

  return { success: true, user: data.user };
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

  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function getCurrentProfile() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, role")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    return null;
  }

  return data ?? null;
}