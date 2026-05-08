 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidEmail, normalizeEmail } from "../../lib/validation";
import { registerUser } from "../../lib/auth";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setIsSuccess(false);

    const cleanEmail = normalizeEmail(email);

    if (!name.trim() || !cleanEmail || !password.trim() || !studentId.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (!/^[0-9]{2}P[0-9]{4}$/i.test(studentId.trim())) {
      setMessage("Student ID must follow format YYP#### (example: 23P0216).");
      return;
    }

    const result = await registerUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      studentId: studentId.trim().toUpperCase(),
      role: "student", 
    });

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    setIsSuccess(true);
    setMessage("Account created successfully. Redirecting to login...");

    setTimeout(() => {
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
          <a href="/signin">Sign in</a>
          <a href="/signup">Create account</a>
        </nav>

        <div className="portal-content">
          <div className="login-area">
            <form onSubmit={handleSubmit}>
              <input
                className="form-input"
                placeholder="Full Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

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

              <input
                className="form-input"
                placeholder="Student ID (YYP####)"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value.toUpperCase())}
              />

              <button className="primary-btn">Create Account</button>

              {message && (
                <div className={isSuccess ? "message success" : "message"}>
                  {message}
                </div>
              )}
            </form>

            <div className="side-info">
              <a href="/signin">Already have an account?</a>
              <p>
                Use your university email if available{" "}
                <span className="help-icon">?</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


