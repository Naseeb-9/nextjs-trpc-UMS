"use client";

import Private from "@/components/Private";
import { trpc } from "@/utils/trpc";
import { useEffect, useMemo, useState } from "react";
import { ClipboardDocumentListIcon, UserPlusIcon } from "@heroicons/react/24/solid";

export default function StudentsPage() {
  const utils = trpc.useUtils();
  const session = trpc.auth.session.useQuery(); // role lane ke liye
  const isStudent = useMemo(() => session.data?.role === "student", [session.data?.role]);

  const { data: students, isLoading, error, refetch } = trpc.students.list.useQuery();

  const addStudent = trpc.students.add.useMutation({
    onSuccess: () => {
      setSuccess("✅ Student added successfully!");
      setForm({ name: "", email: "", password: "", roll_number: "", department: "" });
      utils.students.list.invalidate();
    },
    onError: (e) => setError(e.message),
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roll_number: "",
    department: "",
  });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [errorMsg, setError] = useState("");
  const [successMsg, setSuccess] = useState("");

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccess(""), 2500);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  return (
    <Private allowedRoles={["superadmin", "student"]}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="max-w-6xl w-full space-y-10">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            🎓 Manage Students
          </h2>

          {/* Grid Layout: Form Left | Table Right */}
          <div className={`grid grid-cols-1 ${isStudent ? "md:grid-cols-1" : "md:grid-cols-2"} gap-8`}>
            {/* Form Section (hide for 'student' role) */}
            {!isStudent && (
              <div className="bg-white shadow-lg rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                  <UserPlusIcon className="h-5 w-5 text-blue-600" /> Add New Student
                </h3>

                {errorMsg && (
                  <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-400 rounded">
                    ⚠️ {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 p-3 text-green-700 bg-green-100 border border-green-400 rounded">
                    {successMsg}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError("");
                    setSuccess("");
                    addStudent.mutate(form);
                  }}
                  className="grid grid-cols-1 gap-4"
                >
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
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Roll Number"
                    value={form.roll_number}
                    onChange={(e) => setForm({ ...form, roll_number: e.target.value })}
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Department"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                  />
                  <button
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
                    disabled={addStudent.isLoading}
                  >
                    {addStudent.isLoading ? "Adding..." : "Add Student"}
                  </button>
                </form>
              </div>
            )}

            {/* Table Section */}
            <div
              className={`bg-white shadow-lg rounded-xl p-6 overflow-auto ${
                isStudent ? "md:col-span-2 max-w-3xl mx-auto w-full" : ""
              }`}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" /> Student List
              </h3>

              {isLoading && <p>Loading…</p>}
              {error && <p className="text-red-600">{error.message}</p>}

              <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Roll No</th>
                    <th className="px-4 py-2 border">Department</th>
                    <th className="px-4 py-2 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(students ?? []).map((s, i) => (
                    <FragmentRow
                      key={s.id}
                      s={s}
                      i={i}
                      expanded={expanded}
                      setExpanded={setExpanded}
                    />
                  ))}
                  {(students ?? []).length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">
                        No students added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-3">
                <button
                  className="text-sm underline text-blue-600"
                  onClick={() => refetch()}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Private>
  );
}

function FragmentRow({
  s,
  i,
  expanded,
  setExpanded,
}: {
  s: {
    id: number;
    name: string;
    email: string;
    roll_number: string;
    department: string;
    Courses?: { id: number; name: string; code?: string | null }[];
  };
  i: number;
  expanded: number | null;
  setExpanded: (id: number | null) => void;
}) {
  return (
    <>
      {/* Main Student Row */}
      <tr
        className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition`}
      >
        <td className="px-4 py-2 border">{s.id}</td>
        <td className="px-4 py-2 border">{s.name}</td>
        <td className="px-4 py-2 border">{s.email}</td>
        <td className="px-4 py-2 border">{s.roll_number}</td>
        <td className="px-4 py-2 border">{s.department}</td>
        <td className="px-4 py-2 border text-center">
          <button
            className="text-blue-600 font-medium hover:underline"
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
          >
            {expanded === s.id ? "Hide Courses" : "View Courses"}
          </button>
        </td>
      </tr>

      {/* Expanded Courses Row */}
      {expanded === s.id && (
        <tr className="bg-blue-50">
          <td colSpan={6} className="px-4 py-3 border">
            {s.Courses && s.Courses.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {s.Courses.map((c) => (
                  <li key={c.id} className="text-sm text-gray-700">
                    {c.name} {c.code ? <span className="text-gray-500">({c.code})</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500 italic">No Courses</span>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
