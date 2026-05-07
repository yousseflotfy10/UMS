"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import { getRegistrationStats } from "../../lib/community";

export default function StaffProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || !["admin", "professor"].includes(currentUser.role)) {
        router.push("/signin");
        return;
      }

      setUser(currentUser);
      setAssignedCourses(
        currentUser.role === "professor"
          ? await getRegistrationStats(currentUser.name)
          : []
      );
    }

    init();
  }, [router]);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Staff Profile</h2>
        <p>Staff members can view their profile information and assigned courses.</p>

        <hr />

        {!user && <p>Loading profile...</p>}

        {user && (
          <div className="info-card">
            <h3>{user.name}</h3>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role === "professor" ? "Doctor" : "Admin"}
            </p>
          </div>
        )}

        <h3>Assigned Courses</h3>

        {user?.role === "admin" && (
          <p>Admin profile has system-wide access and is not assigned to one course.</p>
        )}

        {user?.role === "professor" && assignedCourses.length === 0 && (
          <p>No courses assigned yet.</p>
        )}

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
      </div>
    </PortalShell>
  );
}
