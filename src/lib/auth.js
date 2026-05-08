import { supabase, clearSupabaseAuthStorage, isSupabaseConfigured, getSupabaseConfigError } from "./supabase";
import { isValidEmail, normalizeEmail } from "./validation";

function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const message = String(error?.message || "").trim();

  if (
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("fetch")
  ) {
    return "Could not connect to Supabase. Check your internet connection and make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct.";
  }

  return message || fallback;
}

function isFetchError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("network") || message.includes("fetch");
}

function requireSupabaseConfig() {
  if (!isSupabaseConfigured) {
    return { success: false, message: getSupabaseConfigError() };
  }

  return null;
}

export async function registerUser(newUser) {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return configError;

    const normalizedEmail = normalizeEmail(newUser.email);

    if (!newUser.name?.trim() || !normalizedEmail || !newUser.password) {
      return { success: false, message: "Please fill all required fields." };
    }

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, message: "Please enter a valid email address." };
    }

    if (String(newUser.password).length < 6) {
      return { success: false, message: "Password must be at least 6 characters." };
    }

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingProfileError) {
      return { success: false, message: existingProfileError.message };
    }

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
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function loginUser(email, password) {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return configError;

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail) || !String(password || "").trim()) {
      return { success: false, message: "Invalid email or password." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      return { success: false, message: "Invalid email or password." };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      return { success: false, message: profileError.message };
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email: profile?.email || data.user.email,
        name: profile?.name || data.user.user_metadata?.full_name || "User",
        role: profile?.role || "student",
      },
    };
  } catch (error) {
    return { success: false, message: getErrorMessage(error, "Invalid email or password.") };
  }
}

export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    clearSupabaseAuthStorage();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (error) {
    clearSupabaseAuthStorage();
    return { success: true };
  }
}

export async function getCurrentUser() {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return null;

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) return null;
    return data.user;
  } catch (error) {
    if (isFetchError(error)) {
      clearSupabaseAuthStorage();
    }

    return null;
  }
}

export async function getCurrentProfile() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data ?? null;
  } catch (error) {
    return null;
  }
}

export async function getCurrentAppUser() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return null;

    const profile = await getCurrentProfile();
    if (!profile) {
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || "User",
        role: "student",
      };
    }

    return {
      id: authUser.id,
      email: profile.email || authUser.email,
      name: profile.name,
      role: profile.role,
    };
  } catch (error) {
    return null;
  }
}

export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("role", "student")
      .order("name", { ascending: true });

    if (error) return [];
    return data ?? [];
  } catch (error) {
    return [];
  }
}

export async function getProfessors() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .in("role", ["professor", "doctor"])
      .order("name", { ascending: true });

    if (error) return [];
    return data ?? [];
  } catch (error) {
    return [];
  }
}

export async function updateCurrentUserProfile({ name, password }) {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return configError;

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, message: "You must be logged in to update your profile." };
    }

    const cleanName = String(name || "").trim();
    const cleanPassword = String(password || "");

    if (!cleanName) {
      return { success: false, message: "Name cannot be empty." };
    }

    if (cleanPassword && cleanPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: cleanName })
      .eq("id", currentUser.id);

    if (profileError) {
      return { success: false, message: profileError.message };
    }

    const authUpdate = {
      data: { full_name: cleanName },
    };

    if (cleanPassword) {
      authUpdate.password = cleanPassword;
    }

    const { error: authError } = await supabase.auth.updateUser(authUpdate);

    if (authError) {
      return { success: false, message: authError.message };
    }

    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}
