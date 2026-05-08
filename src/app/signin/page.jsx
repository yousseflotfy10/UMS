"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidEmail, normalizeEmail } from "../../lib/validation";
import { loginUser, logoutUser } from "../../lib/auth";

const ALLOWED_ROLES = ["student", "professor", "doctor", "admin"];

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password.trim()) {
      setMessage("Please enter email and password.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    const result = await loginUser(cleanEmail, password);

    if (!result.success || !result.user) {
      setMessage("Invalid email or password.");
      return;
    }

    const user = result.user;
    const role = user.role || "student";

    if (!ALLOWED_ROLES.includes(role)) {
      await logoutUser();
      setMessage("This account type is not available in this sprint version.");
      return;
    }

    if (role === "admin") {
      router.push("/BookingPage");
      return;
    }

    router.push("/dashboard");
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
          <div className="login-area">
            <form onSubmit={handleLogin}>
              <input
                className="form-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <input
                className="form-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <button className="primary-btn">Log in</button>

              {message && <div className="message">{message}</div>}
            </form>

            <div className="side-info">
              <Link href="/signup">Create a new account</Link>
              <p>
                Cookies must be enabled in your browser{" "}
                <span className="help-icon">?</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
