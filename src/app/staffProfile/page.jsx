"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser, updateCurrentUserProfile } from "../../lib/auth";
import { getRegistrationStats } from "../../lib/community";

export default function StaffProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      setName(currentUser.name || "");
      setAssignedCourses(
        ["professor", "doctor"].includes(currentUser.role)
          ? await getRegistrationStats(currentUser.name)
          : []
      );
    }

    init();
  }, [router]);

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Name cannot be empty.");
      return;
    }

    if (password && password !== confirmPassword) {
      setMessage("Password confirmation does not match.");
      return;
    }

    const result = await updateCurrentUserProfile({
      name: name.trim(),
      password,
    });

    setMessage(result.message);

    if (result.success) {
      setPassword("");
      setConfirmPassword("");
      const updatedUser = await getCurrentAppUser();
      setUser(updatedUser);
    }
  }

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Profile</h2>
        <p>View and update your account information.</p>

        <hr />

        {!user && <p>Loading profile...</p>}

        {user && (
          <>
            <div className="info-card">
              <h3>{user.name}</h3>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Role:</strong> {["professor", "doctor"].includes(user.role) ? "Doctor" : user.role}
              </p>
            </div>

            <form className="stacked-form" onSubmit={handleSave}>
              <label className="field-label">
                Name
                <input
                  className="form-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                />
              </label>

              <label className="field-label">
                New Password Optional
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Leave empty to keep current password"
                />
              </label>

              <label className="field-label">
                Confirm New Password
                <input
                  className="form-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                />
              </label>

              <button className="primary-btn" type="submit">Save Profile</button>
            </form>

            {message && (
              <div className={message.includes("successfully") ? "message success" : "message"}>
                {message}
              </div>
            )}
          </>
        )}

        {["professor", "doctor"].includes(user?.role) && (
          <>
            <hr />
            <h3>Assigned Courses</h3>
            {assignedCourses.length === 0 && <p>No courses assigned yet.</p>}

            {assignedCourses.map((course) => (
              <div className="info-card" key={course.id}>
                <h3>
                  {course.name} ({course.code})
                </h3>
                <p>
                  <strong>Department:</strong> {course.department || "Not specified"}
                </p>
                <p>
                  <strong>Level:</strong> {course.level || "Not specified"} |{" "}
                  <strong>Credits:</strong> {course.credits || "Not specified"}
                </p>
                <p>
                  <strong>Registered students:</strong> {course.registeredCount || 0}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </PortalShell>
  );
}
