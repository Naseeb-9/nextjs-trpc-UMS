"use client";

import Private from "@/components/Private";
import { trpc } from "@/utils/trpc";
import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import { ClipboardDocumentListIcon, BookOpenIcon } from "@heroicons/react/24/solid";

export default function CoursesPage() {
  const session = trpc.auth.session.useQuery();
  const isStudent = session.data?.role === "student";

  // queries
  const { data: courses, isLoading: loadingCourses, error: errCourses, refetch: refetchCourses } =
    trpc.courses.list.useQuery();

  // teachers/students lists for superadmin UI
  const teachersQ = trpc.teachers.list.useQuery(undefined, { enabled: !isStudent });
  const studentsQ = trpc.students.list.useQuery(undefined, { enabled: !isStudent || isStudent });

  // mutations
  const utils = trpc.useUtils();
  const addCourse = trpc.courses.add.useMutation({
    onSuccess: () => {
      setSuccess("✅ Course added successfully!");
      setForm({ name: "", code: "", credits: "" });
      utils.courses.list.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const assignTeacher = trpc.courses.assignTeacher.useMutation({
    onSuccess: () => {
      setSuccess("✅ Teacher assigned!");
      utils.courses.list.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const enroll = trpc.courses.enroll.useMutation({
    onSuccess: (msg) => {
      setSuccess(msg || "✅ Enrolled successfully!");
      utils.courses.list.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  // local state
  const [form, setForm] = useState({ name: "", code: "", credits: "" });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Record<number, string | number>>({});
  const [selectedStudents, setSelectedStudents] = useState<Record<number, string>>({});

  // current logged-in student's own record (students list endpoint backend-side filter karta hai)
  const me = useMemo(() => {
    if (!isStudent) return null;
    const arr = studentsQ.data as any[] | undefined;
    return arr && arr.length ? arr[0] : null;
  }, [isStudent, studentsQ.data]);

  // helpers
  const alreadyEnrolled = useCallback(
    (course: any) => {
      if (!isStudent || !me || !Array.isArray(course?.Students)) return false;
      return course.Students.some((s: any) => s.id === me.id);
    },
    [isStudent, me]
  );

  const handleAddCourse = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      addCourse.mutate({
        name: form.name,
        code: form.code,
        credits: form.credits || "0",
      });
    },
    [form, addCourse]
  );

  const handleSaveTeacher = useCallback(
    (courseId: number) => {
      setError("");
      setSuccess("");
      const teacherId = selectedTeacher[courseId];
      if (!teacherId) {
        setError("⚠️ Please select a teacher");
        return;
      }
      assignTeacher.mutate({ courseId, teacherId });
    },
    [assignTeacher, selectedTeacher]
  );

  const handleSaveStudent = useCallback(
    (courseId: number) => {
      setError("");
      setSuccess("");
      const rollNumber = selectedStudents[courseId];
      if (!rollNumber) {
        setError("⚠️ Please select a student");
        return;
      }
      enroll.mutate({ courseId, rollNumber });
    },
    [enroll, selectedStudents]
  );

  const handleEnrollMe = useCallback(
    (courseId: number) => {
      if (!me?.roll_number) return setError("Your roll number not found.");
      setError("");
      setSuccess("");
      enroll.mutate({ courseId, rollNumber: me.roll_number });
    },
    [enroll, me]
  );

  useEffect(() => {
    if (errCourses) setError((errCourses as any).message ?? "Failed to load courses");
  }, [errCourses]);

  return (
    <Private allowedRoles={["superadmin", "teacher", "student"]}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="max-w-6xl w-full space-y-10">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            📚 Manage Courses
          </h2>

          {/* Alerts (admin/teacher global) */}
          {!isStudent && error && (
            <div className="mb-2 p-3 text-red-700 bg-red-100 border border-red-400 rounded">⚠️ {error}</div>
          )}
          {!isStudent && success && (
            <div className="mb-2 p-3 text-green-700 bg-green-100 border border-green-400 rounded">{success}</div>
          )}

          {/* Add Course Form — HIDE for students */}
          {!isStudent && (
            <div className="bg-white shadow-lg rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <BookOpenIcon className="h-5 w-5 text-blue-600" /> Add New Course
              </h3>

              <form onSubmit={handleAddCourse} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Course Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Credits"
                  value={form.credits}
                  onChange={(e) => setForm({ ...form, credits: e.target.value })}
                />
                <button
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition col-span-full"
                  disabled={addCourse.isLoading}
                >
                  {addCourse.isLoading ? "Adding..." : "Add Course"}
                </button>
              </form>
            </div>
          )}

          {/* Courses Table */}
          <div className="bg-white shadow-lg rounded-xl p-6 overflow-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" /> Course List
            </h3>

            {/* Student-only alerts */}
            {isStudent && error && (
              <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-400 rounded">⚠️ {error}</div>
            )}
            {isStudent && success && (
              <div className="mb-4 p-3 text-green-700 bg-green-100 border border-green-400 rounded">{success}</div>
            )}

            {loadingCourses ? (
              <p>Loading…</p>
            ) : (
              <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Code</th>
                    <th className="px-4 py-2 border">Credits</th>
                    <th className="px-4 py-2 border">Teacher</th>
                    <th className="px-4 py-2 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(courses ?? []).map((c: any, i: number) => (
                    <Fragment key={c.id}>
                      <tr className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition`}>
                        <td className="px-4 py-2 border">{c.id}</td>
                        <td className="px-4 py-2 border">{c.name}</td>
                        <td className="px-4 py-2 border">{c.code}</td>
                        <td className="px-4 py-2 border">{c.credits}</td>
                        <td className="px-4 py-2 border">{c.Teacher ? c.Teacher.name : "Not Assigned"}</td>
                        <td className="px-4 py-2 border text-center">
                          {!isStudent && (
                            <button
                              className="text-blue-600 font-medium hover:underline mr-4"
                              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                            >
                              {expanded === c.id ? "Hide Details" : "View Details"}
                            </button>
                          )}

                          {isStudent && (
                            <button
                              disabled={alreadyEnrolled(c)}
                              onClick={() => handleEnrollMe(c.id)}
                              className={`px-3 py-1 rounded text-white ${
                                alreadyEnrolled(c)
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {alreadyEnrolled(c) ? "Enrolled" : "Enroll me"}
                            </button>
                          )}
                        </td>
                      </tr>

                      {!isStudent && expanded === c.id && (
                        <tr className="bg-blue-50">
                          <td colSpan={6} className="px-4 py-3 border">
                            {/* Assign Teacher */}
                            <div className="mb-4">
                              <h4 className="font-semibold mb-2">Assign Teacher:</h4>
                              <select
                                className="border rounded px-3 py-2 mr-2"
                                value={selectedTeacher[c.id] || ""}
                                onChange={(e) =>
                                  setSelectedTeacher({ ...selectedTeacher, [c.id]: e.target.value })
                                }
                              >
                                <option value="" disabled>
                                  Select Teacher
                                </option>
                                {(teachersQ.data ?? []).map((t: any) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded ml-2"
                                onClick={() => handleSaveTeacher(c.id)}
                                disabled={assignTeacher.isLoading}
                              >
                                {assignTeacher.isLoading ? "Saving..." : "Save"}
                              </button>
                            </div>

                            {/* Enroll Students */}
                            <div>
                              <h4 className="font-semibold mb-2">Enroll Student:</h4>
                              <select
                                className="border rounded px-3 py-2 mr-2 w-full"
                                value={selectedStudents[c.id] || ""}
                                onChange={(e) =>
                                  setSelectedStudents({ ...selectedStudents, [c.id]: e.target.value })
                                }
                              >
                                <option value="" disabled>
                                  Select Student
                                </option>
                                {(studentsQ.data ?? []).map((s: any) => (
                                  <option key={s.id} value={s.roll_number}>
                                    {s.name} ({s.roll_number})
                                  </option>
                                ))}
                              </select>
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded mt-2"
                                onClick={() => handleSaveStudent(c.id)}
                                disabled={enroll.isLoading}
                              >
                                {enroll.isLoading ? "Saving..." : "Save"}
                              </button>
                            </div>

                            {/* Enrolled Students List */}
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">Enrolled Students:</h4>
                              {c.Students && c.Students.length > 0 ? (
                                <ul className="list-disc list-inside space-y-1">
                                  {c.Students.map((s: any) => (
                                    <li key={s.id}>
                                      {s.name} <span className="text-gray-500">({s.roll_number})</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-gray-500 italic">No students enrolled</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {(courses ?? []).length === 0 && !loadingCourses && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">
                        No courses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <div className="mt-3">
              <button className="text-sm underline text-blue-600" onClick={() => refetchCourses()}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </Private>
  );
}
