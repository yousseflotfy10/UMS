"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearSupabaseAuthStorage,
  getSupabaseConfigError,
  isSupabaseConfigured,
  supabase,
} from "../../lib/supabase";
import { resetPasswordDirectlyByEmail, updateRecoveryPassword } from "../../lib/auth";
import { isValidEmail, normalizeEmail } from "../../lib/validation";

function readHashParams() {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash || "";
  return new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
}

function cleanResetUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, document.title, window.location.pathname);
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [simpleEmail, setSimpleEmail] = useState("");
  const [simpleMode, setSimpleMode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Checking reset details...");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function preparePasswordReset() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const mode = searchParams.get("mode") || "";
        const emailFromUrl = normalizeEmail(searchParams.get("email") || "");
        const isSimpleMode = mode === "simple" && isValidEmail(emailFromUrl);

        if (isSimpleMode) {
          if (!mounted) return;
          setSimpleMode(true);
          setSimpleEmail(emailFromUrl);
          setReady(true);
          setMessage(`Email verified. Enter a new password for ${emailFromUrl}.`);
          setMessageType("success");
          return;
        }

        if (!isSupabaseConfigured) {
          throw new Error(getSupabaseConfigError());
        }

        const hashParams = readHashParams();

        const errorDescription =
          searchParams.get("error_description") || hashParams.get("error_description");

        if (errorDescription) {
          throw new Error(errorDescription.replace(/\+/g, " "));
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = searchParams.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;
          cleanResetUrl();
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;
          cleanResetUrl();
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!mounted) return;

        if (data?.session?.user) {
          setReady(true);
          setMessage("Reset link verified. Enter your new password below.");
          setMessageType("success");
        } else {
          setReady(false);
          setMessage("Please verify your email first from the forgot password page.");
          setMessageType("error");
        }
      } catch (error) {
        if (!mounted) return;

        setReady(false);
        setMessage(
          error?.message ||
            "Could not verify the reset details. Please go back to forgot password and try again."
        );
        setMessageType("error");
      }
    }

    preparePasswordReset();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpdate(event) {
    event.preventDefault();
    setMessage("");

    if (!ready) {
      setMessageType("error");
      setMessage("Please verify your email first from the forgot password page.");
      return;
    }

    if (!password || !confirmPassword) {
      setMessageType("error");
      setMessage("Please enter and confirm your new password.");
      return;
    }

    if (password.length < 6) {
      setMessageType("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = simpleMode
      ? await resetPasswordDirectlyByEmail(simpleEmail, password)
      : await updateRecoveryPassword(password);
    setLoading(false);

    if (!result.success) {
      setMessageType("error");
      setMessage(result.message || "Could not update password. Please try again.");
      return;
    }

    setMessageType("success");
    setMessage("Password updated successfully. Redirecting to sign in...");

    setTimeout(async () => {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        // Ignore sign out errors after a successful password update.
      }

      clearSupabaseAuthStorage();
      router.push("/signin");
    }, 1000);
  }

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
        </header>

        <nav className="portal-tabs">
          <Link href="/signin">Sign in</Link>
          <Link href="/forgot-password">Forgot password</Link>
        </nav>

        <div className="portal-content">
          <div className="content-box">
            <h2>Choose a new password</h2>

            {message && (
              <div className={`message ${messageType === "success" ? "success" : ""}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleUpdate} className="stacked-form" noValidate>
              <label className="field-label">
                New password
                <input
                  className="form-input"
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={!ready || loading}
                />
              </label>

              <label className="field-label">
                Confirm new password
                <input
                  className="form-input"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={!ready || loading}
                />
              </label>

              <button className="primary-btn" disabled={!ready || loading}>
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>

            <div className="side-info reset-links">
              <Link href="/forgot-password">Use another email</Link>
              <Link href="/signin">Back to sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
