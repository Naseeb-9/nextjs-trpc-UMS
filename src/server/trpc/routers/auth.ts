import { z } from "zod";
import { router, publicProcedure } from "../index";
import jwt from "jsonwebtoken"; // npm i jsonwebtoken

const User = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.string(),
});

const LoginResponse = z.object({
  success: z.boolean(),
  token: z.string(),
  user: User,
});

const RegisterResponse = z.object({
  success: z.boolean(),
  user: User,
});

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.string(), // backend expects role in body
      })
    )
    .mutation(async ({ input }) => {
      const r = await fetch(`${process.env.API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error || "Registration failed");
      }
      const data = RegisterResponse.parse(await r.json());
      return data;
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const r = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err?.error || "Invalid credentials");
      }
      const data = LoginResponse.parse(await r.json());

      // HttpOnly cookie set
      ctx.cookies.set(process.env.JWT_COOKIE_NAME || "token", data.token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // secure: true, // prod over HTTPS
        maxAge: 60 * 60 * 24 * 7, // 7d
      });

      return { success: data.success, user: data.user };
    }),

  // 👇 NEW: session check (decode JWT from HttpOnly cookie)
  session: publicProcedure.query(async ({ ctx }) => {
    const raw = ctx.jwt;
    if (!raw) {
      return { isAuthenticated: false as const, role: null as null | string, user: null as any };
    }

    try {
      const decoded = jwt.decode(raw) as { id?: number; role?: string; email?: string } | null;
      return {
        isAuthenticated: true as const,
        role: decoded?.role ?? null,
        user: decoded ? { id: decoded.id, email: decoded.email } : null,
      };
    } catch {
      return { isAuthenticated: false as const, role: null, user: null };
    }
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.cookies.delete(process.env.JWT_COOKIE_NAME || "token");
    return { success: true };
  }),
});
