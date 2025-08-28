import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../index";

// --- Schemas that match your controller output ---
const TeacherMini = z.object({
  id: z.number(),
  name: z.string(),
});

const StudentMini = z.object({
  id: z.number(),
  name: z.string(),
  roll_number: z.string(),
});

const Course = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().nullable().optional(),
  credits: z.number().or(z.string()), // controller returns whatever was saved; allow string too
  Teacher: TeacherMini.nullish(),
  Students: z.array(StudentMini).optional(),
});

const ListResponse = z.object({ success: z.boolean(), data: z.array(Course) });
const AddResponse  = z.object({ success: z.boolean(), data: Course });
const MsgResponse  = z.object({ success: z.boolean(), message: z.string() });
const SessionsResponse = z.object({
  success: z.boolean(),
  data: z.array(z.any()), // you can replace with real session schema later
});

export const coursesRouter = router({
  // GET /courses (public in router, but your backend doesn't require role here; still use protected to forward JWT)
  list: protectedProcedure.query(async ({ ctx }) => {
    const r = await fetch(`${process.env.API_BASE_URL}/courses`, {
      headers: { Authorization: `Bearer ${ctx.jwt}` },
      cache: "no-store",
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json?.message || json?.error || "Failed to load courses");
    return ListResponse.parse(json).data;
  }),

  // POST /courses  (superadmin)
  add: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      code: z.string().min(1),
      credits: z.union([z.number(), z.string().regex(/^\d+$/)]),
    }))
    .mutation(async ({ input, ctx }) => {
      const r = await fetch(`${process.env.API_BASE_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.jwt}`,
        },
        body: JSON.stringify({
          name: input.name,
          code: input.code,
          credits: typeof input.credits === "string" ? Number(input.credits) : input.credits,
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json?.message || json?.error || "Failed to add course");
      return AddResponse.parse(json).data;
    }),

  // POST /courses/:id/assign-teacher  (superadmin)
  assignTeacher: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      teacherId: z.union([z.number(), z.string().regex(/^\d+$/)]),
    }))
    .mutation(async ({ input, ctx }) => {
      const r = await fetch(`${process.env.API_BASE_URL}/courses/${input.courseId}/assign-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.jwt}`,
        },
        body: JSON.stringify({ teacherId: Number(input.teacherId) }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json?.message || json?.error || "Failed to assign teacher");
      return MsgResponse.parse(json).message;
    }),

  // POST /courses/:id/enroll  (student, superadmin)
  enroll: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      rollNumber: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const r = await fetch(`${process.env.API_BASE_URL}/courses/${input.courseId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.jwt}`,
        },
        body: JSON.stringify({ rollNumber: input.rollNumber }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json?.message || json?.error || "Failed to enroll student");
      return MsgResponse.parse(json).message;
    }),

  // GET /courses/:id/sessions  (optional for page)
  sessionsByCourse: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const r = await fetch(`${process.env.API_BASE_URL}/courses/${input.courseId}/sessions`, {
        headers: { Authorization: `Bearer ${ctx.jwt}` },
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json?.message || json?.error || "Failed to load sessions");
      return SessionsResponse.parse(json).data;
    }),
});
