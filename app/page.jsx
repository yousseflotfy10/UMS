'use client'

import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function Home() {

  const [courses, setCourses] = useState([])

  useEffect(() => {
    async function getCourses() {
      const { data, error } = await supabase
        .from('courses')
        .select('*')

      console.log("DATA:", data)
      console.log("ERROR:", error)

      setCourses(data || [])
    }

    getCourses()
  }, [])

  return (
    <div>
      <h1>Courses</h1>

      {courses.map(course => (
        <p key={course.id}>
          {course.name} - {course.code}
        </p>
      ))}
    </div>
  )
}