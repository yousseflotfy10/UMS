"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../lib/auth";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

async function handleLogin(event) {
  event.preventDefault();
  setMessage("");

  if (!email.trim() || !password.trim()) {
    setMessage("Please enter email and password.");
    return;
  }

  const result = await loginUser(email.trim(), password);

  // ✅ STOP if login failed
  if (!result.success || !result.user) {
    setMessage("Invalid email or password.");
    return;
  }
const user = result.user;
const role = user.role || "student";

if (role === "admin") {
  router.push("/adminDashboard");
} else if (role === "professor") {
  router.push("/professorDashboard");
} else {
  router.push("/dashboard");
}
}

  return (
    <main className="portal-page">
      <div className="portal-wrapper">
        <header className="portal-header">
          <h1>UMS</h1>
        </header>

        <nav className="portal-tabs">
          <a href="/signin">Sign in</a>
          <a href="/signup">Create account</a>
        </nav>

        <div className="portal-content">
          <div className="login-area">
            <form onSubmit={handleLogin}>
              <input
                className="form-input"
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
              <a href="/signup">Create a new account</a>
              <a href="#">Forgotten your username or password?</a>
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
