"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { trpc } from "@/utils/trpc";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // session from tRPC (reads JWT from HttpOnly cookie on server)
  const { data: session } = trpc.auth.session.useQuery();
  const isAuthed = !!session?.isAuthenticated;
  const role = session?.role ?? null;

  const LINKS_BY_ROLE: Record<string, { to: string; label: string }[]> = {
    student: [
      { to: "/students", label: "Students" },
      { to: "/courses", label: "Courses" },
    ],
    teacher: [
      { to: "/teachers", label: "Teachers" },
    ],
    superadmin: [
      { to: "/students", label: "Students" },
      { to: "/teachers", label: "Teachers" },
      { to: "/courses", label: "Courses" },
      { to: "/sessions", label: "Sessions" },
    ],
  };

  const links = useMemo(
    () => (isAuthed && role ? (LINKS_BY_ROLE[role] || []) : []),
    [isAuthed, role]
  );

  const linkClass = (to: string) =>
    `relative transition duration-300 ${
      pathname === to ? "text-blue-400" : "hover:text-blue-300"
    }`;

  const underline = (to: string) =>
    `absolute left-0 -bottom-1 w-full h-0.5 bg-blue-400 transform origin-left scale-x-0 transition-transform duration-300 ${
      pathname === to ? "scale-x-100" : "hover:scale-x-100"
    }`;

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => router.push("/login"),
  });

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-blue-400 drop-shadow-lg">
          🎓 UMS
        </h1>

        {/* Desktop */}
        <div className="hidden md:flex gap-8 items-center">
          {links.map((link) => (
            <Link key={link.to} href={link.to} className={linkClass(link.to)}>
              {link.label}
              <span className={underline(link.to)} />
            </Link>
          ))}

          {!isAuthed ? (
            <>
              <Link href="/login" className={linkClass("/login")}>
                Login
              </Link>
              <Link href="/register" className={linkClass("/register")}>
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={() => logout.mutate()}
              className="bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile button */}
        <button
          className="md:hidden text-2xl focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className={`block text-lg ${
                pathname === link.to
                  ? "text-blue-400 font-semibold"
                  : "hover:text-blue-300"
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {!isAuthed ? (
            <>
              <Link
                href="/login"
                className={`block text-lg ${
                  pathname === "/login"
                    ? "text-blue-400 font-semibold"
                    : "hover:text-blue-300"
                }`}
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`block text-lg ${
                  pathname === "/register"
                    ? "text-blue-400 font-semibold"
                    : "hover:text-blue-300"
                }`}
                onClick={() => setIsOpen(false)}
              >
                Register
              </Link>
            </>
          ) : (
            <button
              onClick={() => {
                logout.mutate();
                setIsOpen(false);
              }}
              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
