"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalShell from "../../components/PortalShell";
import { getCurrentAppUser } from "../../lib/auth";
import { getRegistrations } from "../../lib/community";

export default function MyCoursesPage() {
  const router = useRouter();
  const [registeredCourses, setRegisteredCourses] = useState([]);

  useEffect(() => {
    async function init() {
      const currentUser = await getCurrentAppUser();

      if (!currentUser || currentUser.role !== "student") {
        router.push("/signin");
        return;
      }

      const all = await getRegistrations();
      setRegisteredCourses(all.filter((item) => item.userId === currentUser.id));
    }
    init();
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
