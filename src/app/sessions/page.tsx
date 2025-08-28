"use client";

import Private from "@/components/Private";
import { trpc } from "@/utils/trpc";
import { useState, Fragment } from "react";
import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";

export default function SessionsPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({
    course_id: "",
    teacher_id: "",
    date: "",
    time: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Queries
  const { data: courses } = trpc.courses.list.useQuery();
  const { data: teachers } = trpc.teachers.list.useQuery();
  const sessionsByCourse = trpc.sessions.byCourse.useQuery(
    { courseId: expanded || 0 },
    { enabled: !!expanded }
  );

  // Mutation
  const utils = trpc.useUtils();
  const addSession = trpc.sessions.add.useMutation({
    onSuccess: () => {
      setSuccess("✅ Session scheduled successfully!");
      setForm({ course_id: "", teacher_id: "", date: "", time: "" });
      if (expanded) utils.sessions.byCourse.invalidate({ courseId: expanded });
    },
    onError: (e) => setError(e.message),
  });

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    addSession.mutate({
      course_id: form.course_id,
      teacher_id: form.teacher_id,
      date: form.date,
      time: form.time,
    });
  }

  return (
    <Private allowedRoles={["superadmin"]}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="max-w-6xl w-full space-y-10">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            📅 Manage Sessions
          </h2>

          {/* Schedule Session Form */}
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600" /> Schedule New Session
            </h3>

            {error && (
              <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-400 rounded">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 text-green-700 bg-green-100 border border-green-400 rounded">
                {success}
              </div>
            )}

            <form
              onSubmit={handleSchedule}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <select
                className="border rounded-lg px-3 py-2"
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              >
                <option value="" disabled>
                  Select Course
                </option>
                {(courses ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>

              <select
                className="border rounded-lg px-3 py-2"
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              >
                <option value="" disabled>
                  Select Teacher
                </option>
                {(teachers ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className="border rounded-lg px-3 py-2"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <input
                type="time"
                className="border rounded-lg px-3 py-2"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />

              <button
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition col-span-full"
                disabled={addSession.isLoading}
              >
                {addSession.isLoading ? "Scheduling..." : "Schedule Session"}
              </button>
            </form>
          </div>

          {/* Sessions per course */}
          <div className="bg-white shadow-lg rounded-xl p-6 overflow-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" /> Course
              Sessions
            </h3>

            <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 border">Course</th>
                  <th className="px-4 py-2 border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(courses ?? []).map((c: any) => (
                  <Fragment key={c.id}>
                    <tr className="bg-white hover:bg-blue-50 transition">
                      <td className="px-4 py-2 border">
                        {c.name} <span className="text-gray-500">({c.code})</span>
                      </td>
                      <td className="px-4 py-2 border text-center">
                        <button
                          className="text-blue-600 font-medium hover:underline"
                          onClick={() => {
                            setExpanded(expanded === c.id ? null : c.id);
                          }}
                        >
                          {expanded === c.id ? "Hide Sessions" : "View Sessions"}
                        </button>
                      </td>
                    </tr>

                    {expanded === c.id && (
                      <tr className="bg-blue-50">
                        <td colSpan={2} className="px-4 py-3 border">
                          {sessionsByCourse.data && sessionsByCourse.data.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                              {sessionsByCourse.data.map((s: any) => (
                                <li key={s.id} className="text-sm text-gray-700">
                                  📅 {s.date} ⏰ {s.time} — {s.Teacher?.name}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-500 italic">
                              No sessions scheduled yet.
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Private>
  );
}
