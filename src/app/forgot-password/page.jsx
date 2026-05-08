"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidEmail, normalizeEmail } from "../../lib/validation";
import { verifyEmailForSimplePasswordReset } from "../../lib/auth";
import { getSupabaseConfigError, isSupabaseConfigured } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const configMessage = !isSupabaseConfigured ? getSupabaseConfigError() : "";

  async function handleReset(event) {
    event.preventDefault();
    setMessage("");

    const cleanEmail = normalizeEmail(email);
    setEmail(cleanEmail);

    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessage("Please enter a valid email address, for example name@gmail.com.");
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage(getSupabaseConfigError());
      return;
    }

    setLoading(true);
    const result = await verifyEmailForSimplePasswordReset(cleanEmail);
    setLoading(false);

    if (!result.success) {
      setMessage(result.message || "No account was found with this email address.");
      return;
    }

    router.push(`/update-password?mode=simple&email=${encodeURIComponent(result.email || cleanEmail)}`);
  }

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
        </header>

        <nav className="portal-tabs">
          <Link href="/signin">Sign in</Link>
          <Link href="/signup">Create account</Link>
        </nav>

        <div className="portal-content">
          <div className="content-box">
            <h2>Forgot password</h2>
            <p>
              Enter your account email. If it exists, you will go directly to the password change page.
            </p>

            {configMessage && <div className="message">{configMessage}</div>}

            <form onSubmit={handleReset} className="stacked-form" noValidate>
              <label className="field-label">
                Email address
                <input
                  className="form-input"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck="false"
                  autoCapitalize="none"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setEmail(normalizeEmail(email))}
                />
              </label>

              <button className="primary-btn" disabled={loading} formNoValidate>
                {loading ? "Checking..." : "Continue"}
              </button>

              {message && <div className="message">{message}</div>}
            </form>

            <div className="side-info reset-links">
              <Link href="/signin">Back to sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
