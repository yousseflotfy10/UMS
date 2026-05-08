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


function isSupabaseInvalidEmailError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("email address") && message.includes("invalid");
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
      .select("id, name, email, role, student_id")
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
        student_id: profile?.student_id || null,
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
      .select("id, name, email, role, student_id")
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
  } catch (error) {
    return null;
  }
}

export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, student_id")
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


export async function verifyEmailForSimplePasswordReset(email) {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return configError;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return { success: false, message: "Please enter your email address." };
    }

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, message: "Please enter a valid email address." };
    }

    // Preferred check: secure SQL helper from supabase-simple-forgot-password.sql.
    // It checks auth.users directly, so the email must exist in Supabase Auth.
    const { data: existsFromRpc, error: rpcError } = await supabase.rpc(
      "demo_account_email_exists",
      { user_email: normalizedEmail }
    );

    if (!rpcError) {
      if (!existsFromRpc) {
        return { success: false, message: "No account was found with this email address." };
      }

      return { success: true, email: normalizedEmail };
    }

    // Fallback check for projects that have not run the SQL helper yet.
    // This keeps the page usable if profiles are readable through RLS.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        message:
          "Could not verify this email. Run src/supabase-simple-forgot-password.sql in Supabase SQL Editor, then try again.",
      };
    }

    if (!profile) {
      return { success: false, message: "No account was found with this email address." };
    }

    return { success: true, email: normalizedEmail };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function resetPasswordDirectlyByEmail(email, password) {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return configError;

    const normalizedEmail = normalizeEmail(email);
    const cleanPassword = String(password || "");

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, message: "Please verify your email again." };
    }

    if (!cleanPassword) {
      return { success: false, message: "Please enter a new password." };
    }

    if (cleanPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters." };
    }

    const { error } = await supabase.rpc("demo_reset_password_by_email", {
      user_email: normalizedEmail,
      new_password: cleanPassword,
    });

    if (error) {
      const message = String(error.message || "");

      if (
        message.includes("demo_reset_password_by_email") ||
        message.toLowerCase().includes("function") ||
        message.toLowerCase().includes("schema cache")
      ) {
        return {
          success: false,
          message:
            "Password reset is not installed in Supabase yet. Run src/supabase-simple-forgot-password.sql in Supabase SQL Editor, then try again.",
        };
      }

      return { success: false, message: message || "Could not update password." };
    }

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function sendPasswordResetEmail(email) {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return configError;

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return { success: false, message: "Please enter your email address." };
    }

    if (!isValidEmail(normalizedEmail)) {
      return { success: false, message: "Please enter a valid email address." };
    }

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/update-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (error) {
      // Supabase can sometimes return this message because of Auth project settings
      // or domain restrictions, even when the email format is normal. The app should
      // not show a false "email is invalid" error to the user. For security and UX,
      // show the same neutral reset message after the app accepts the email format.
      if (isSupabaseInvalidEmailError(error)) {
        console.warn("Supabase rejected a syntactically valid reset email:", error.message);
        return {
          success: true,
          message:
            "If an account exists for this email, a password reset link has been sent. If no email arrives, check Supabase Auth email settings and redirect URLs.",
        };
      }

      return { success: false, message: getErrorMessage(error, "Could not send reset email. Please try again.") };
    }

    return {
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
    };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function updateRecoveryPassword(password) {
  try {
    const configError = requireSupabaseConfig();
    if (configError) return configError;

    const cleanPassword = String(password || "");

    if (!cleanPassword) {
      return { success: false, message: "Please enter a new password." };
    }

    if (cleanPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters." };
    }

    const { error } = await supabase.auth.updateUser({
      password: cleanPassword,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: "Password updated successfully." };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}
