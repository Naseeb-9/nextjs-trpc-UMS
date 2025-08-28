"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";

export default function Private({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const { data, isLoading } = trpc.auth.session.useQuery();

  useEffect(() => {
    if (isLoading) return;
    const authed = !!data?.isAuthenticated;
    if (!authed) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && data?.role && !allowedRoles.includes(data.role)) {
      router.replace("/login");
    }
  }, [data, isLoading, allowedRoles, router]);

  if (isLoading) return <p className="p-6">Loading…</p>;
  if (!data?.isAuthenticated) return null; // already redirecting
  if (allowedRoles && data.role && !allowedRoles.includes(data.role)) return null;

  return <>{children}</>;
}
