"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentUser } from "../../lib/fakeAuth";
import { getRegistrations } from "../../lib/fakeCurriculum";

export default function MyCoursesPage() {
  const router = useRouter();
  const [registeredCourses, setRegisteredCourses] = useState([]);

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser || currentUser.role !== "student") {
      router.push("/signin");
      return;
    }

    setRegisteredCourses(getRegistrations(currentUser.email));
  }, [router]);

  return (
    <PortalShell>
      <div className="content-box">
        <h2>My Courses</h2>
        <p>These are the courses you registered for.</p>

        {registeredCourses.length === 0 ? (
          <p>You have not registered for any courses yet.</p>
        ) : (
          registeredCourses.map((course) => (
            <div className="info-card" key={course.id}>
              <h3>
                {course.courseName} ({course.courseCode})
              </h3>
              <p>
                <strong>Doctor:</strong> {course.professor || "Not assigned"}
              </p>
              <p className="meta">Registered on: {course.date}</p>
            </div>
          ))
        )}
      </div>
    </PortalShell>
  );
}
