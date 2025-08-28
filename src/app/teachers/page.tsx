"use client";

import Private from "@/components/Private";
import { trpc } from "@/utils/trpc";
import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import {
  UserPlusIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";

export default function TeachersPage() {
  const session = trpc.auth.session.useQuery();
  const role = session.data?.role ?? null;
  const isTeacher = role === "teacher";

  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // data
  const { data: teachers, isLoading, error: listErr, refetch } = trpc.teachers.list.useQuery();

  useEffect(() => {
    if (listErr) setError(listErr.message);
  }, [listErr]);

  // superadmin add
  const utils = trpc.useUtils();
  const addTeacher = trpc.teachers.add.useMutation({
    onSuccess: () => {
      setSuccess("✅ Teacher added successfully!");
      setForm({ name: "", email: "", password: "", department: "" });
      utils.teachers.list.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const me = useMemo(() => (isTeacher ? (teachers?.[0] ?? null) : null), [isTeacher, teachers]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      addTeacher.mutate(form);
    },
    [form, addTeacher]
  );

  return (
    <Private allowedRoles={["superadmin", "teacher"]}>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        {/* TEACHER SELF VIEW */}
        {isTeacher ? (
          <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex items-center gap-3">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-800">My Teaching</h2>
            </header>

            {error && (
              <div className="p-3 text-red-700 bg-red-100 border border-red-400 rounded">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-green-700 bg-green-100 border border-green-400 rounded">
                {success}
              </div>
            )}

            {/* Profile Card */}
            <div className="bg-white shadow-xl rounded-2xl p-6">
              {!me ? (
                <div className="text-gray-500">{isLoading ? "Loading…" : "No profile found."}</div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative">
                    <UserCircleIcon className="h-20 w-20 text-blue-500" />
                    <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      Teacher
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-800">{me.name}</div>
                    <div className="text-gray-600">{me.email}</div>
                    <div className="mt-1 inline-flex items-center gap-2 text-sm text-gray-700 bg-blue-50 px-2 py-1 rounded">
                      <span className="font-medium">Department:</span>
                      <span className="uppercase tracking-wide">{me.department}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Courses & Enrolled Students */}
            <div className="bg-white shadow-xl rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardDocumentListIcon className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-800">My Courses & Enrolled Students</h3>
              </div>

              {!me ? (
                <div className="text-gray-500">—</div>
              ) : me.Courses && me.Courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {me.Courses.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-lg font-semibold text-gray-800">
                            {c.name}
                            {c.code && <span className="ml-2 text-sm text-gray-500">({c.code})</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Course ID: {c.id}</div>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {Array.isArray(c.Students) ? c.Students.length : 0} enrolled
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Enrolled Students</div>
                        {c.Students && c.Students.length > 0 ? (
                          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                            {c.Students.map((s) => (
                              <li key={s.id} className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                                    {s.name?.charAt(0)?.toUpperCase() || "S"}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">{s.name}</div>
                                    <div className="text-xs text-gray-500">{s.roll_number}</div>
                                  </div>
                                </div>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  Student
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-sm text-gray-500 italic">No students enrolled yet.</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">You have no assigned courses.</div>
              )}
            </div>
          </div>
        ) : (
          // SUPERADMIN VIEW
          <div className="max-w-6xl mx-auto space-y-10">
            <header className="flex items-center gap-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-green-600" />
              <h2 className="text-3xl font-bold text-gray-800">Manage Teachers</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Add Teacher */}
              <div className="bg-white shadow-xl rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <UserPlusIcon className="h-5 w-5 text-blue-600" /> Add New Teacher
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

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
                  <input
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <input
                    type="password"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                    placeholder="Department"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                  <button
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
                    disabled={addTeacher.isLoading}
                  >
                    {addTeacher.isLoading ? "Adding..." : "Add Teacher"}
                  </button>
                </form>
              </div>

              {/* Teachers Table */}
              <div className="bg-white shadow-xl rounded-2xl p-6 overflow-auto">
                <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" /> Teacher List
                </h3>

                {isLoading ? (
                  <p>Loading…</p>
                ) : error ? (
                  <p className="text-red-600">{error}</p>
                ) : (
                  <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 border">ID</th>
                        <th className="px-4 py-2 border">Name</th>
                        <th className="px-4 py-2 border">Email</th>
                        <th className="px-4 py-2 border">Department</th>
                        <th className="px-4 py-2 border text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(teachers ?? []).map((t, i) => (
                        <Fragment key={t.id}>
                          <tr
                            className={`${
                              i % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } hover:bg-blue-50 transition`}
                          >
                            <td className="px-4 py-2 border">{t.id}</td>
                            <td className="px-4 py-2 border">{t.name}</td>
                            <td className="px-4 py-2 border">{t.email}</td>
                            <td className="px-4 py-2 border uppercase">{t.department}</td>
                            <td className="px-4 py-2 border text-center">
                              <button
                                className="text-blue-600 font-medium hover:underline"
                                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                              >
                                {expanded === t.id ? "Hide Courses" : "View Courses"}
                              </button>
                            </td>
                          </tr>

                          {expanded === t.id && (
                            <tr className="bg-blue-50">
                              <td colSpan={5} className="px-4 py-3 border">
                                {t.Courses && t.Courses.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {t.Courses.map((c) => (
                                      <div key={c.id} className="p-4 bg-white rounded-lg border">
                                        <div className="flex items-start justify-between">
                                          <div>
                                            <div className="font-semibold text-gray-800">
                                              {c.name}{" "}
                                              {c.code && (
                                                <span className="text-gray-500">({c.code})</span>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                              Course ID: {c.id}
                                            </div>
                                          </div>
                                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            {Array.isArray(c.Students) ? c.Students.length : 0} enrolled
                                          </span>
                                        </div>

                                        <div className="mt-3">
                                          <div className="text-sm font-medium text-gray-700 mb-1">
                                            Enrolled Students
                                          </div>
                                          {c.Students && c.Students.length > 0 ? (
                                            <ul className="list-disc list-inside space-y-1">
                                              {c.Students.map((s) => (
                                                <li key={s.id} className="text-sm text-gray-700">
                                                  {s.name}{" "}
                                                  <span className="text-gray-500">
                                                    ({s.roll_number})
                                                  </span>
                                                </li>
                                              ))}
                                            </ul>
                                          ) : (
                                            <span className="text-gray-500 italic text-sm">
                                              No students enrolled
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-500 italic">No Courses</span>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                      {(teachers ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-gray-500">
                            No teachers added yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}

                <div className="mt-3">
                  <button className="text-sm underline text-blue-600" onClick={() => refetch()}>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Private>
  );
}
