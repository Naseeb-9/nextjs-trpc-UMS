"use client";

import { trpc } from "@/utils/trpc";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const sessionQuery = trpc.auth.session.useQuery(undefined, { enabled: false });
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      // cookie set — 
      const s = await sessionQuery.refetch();
      const role = s.data?.role;

      if (role === "student") router.replace("/students");
      else if (role === "teacher") router.replace("/teachers");
      else router.replace("/students"); // superadmin default
    },
    onError: (e) => setError(e.message || "Login failed"),
  });

  // if already logged in, redirect by role
  useEffect(() => {
    (async () => {
      const s = await sessionQuery.refetch();
      if (!s.data?.isAuthenticated) return;
      const role = s.data?.role;
      if (role === "student") router.replace("/students");
      else if (role === "teacher") router.replace("/teachers");
      else router.replace("/students");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">🔑 Login</h2>

        {error && (
          <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-400 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            login.mutate(form);
          }}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg px-3 py-2"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            disabled={login.isLoading}
          >
            {login.isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
