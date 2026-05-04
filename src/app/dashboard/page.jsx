"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import { getRegistrations } from "../../lib/fakeCurriculum";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/signin");
      return;
    }
    setUser(currentUser);
    setRegistrations(getRegistrations(currentUser.email));
  }, [router]);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>Dashboard</h2>

        {user && (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </>
        )}

        <hr />

        <h3>Courses & Registration</h3>

        {registrations.length === 0 ? (
          <p>You have not registered for any courses yet. Go to <a href="/courses">Courses</a> to register.</p>
        ) : (
          registrations.map((item) => (
            <div className="info-card" key={item.id}>
              <h3>{item.courseName} ({item.courseCode})</h3>
              <p><strong>Department:</strong> {item.department}</p>
              <p><strong>Level:</strong> {item.level} | <strong>Credits:</strong> {item.credits}</p>
              <p className="meta">Registered on: {item.date}</p>
            </div>
          ))
        )}
      </div>
    </PortalShell>
  );
}
