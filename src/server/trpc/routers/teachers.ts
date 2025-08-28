import { z } from "zod";
import { router, protectedProcedure } from "../index";

// --- Schemas that match your controller output ---
const StudentMini = z.object({
  id: z.number(),
  name: z.string(),
  roll_number: z.string(),
});

const Course = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().nullish(),
  Students: z.array(StudentMini).optional(),
});

const Teacher = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  department: z.string(),
  Courses: z.array(Course).optional(),
});

const ListResponse = z.object({
  success: z.boolean(),
  data: z.array(Teacher),
});

const AddResponse = z.object({
  success: z.boolean(),
  data: Teacher,
});

export const teachersRouter = router({
  // GET /teachers
  list: protectedProcedure.query(async ({ ctx }) => {
    const res = await fetch(`${process.env.API_BASE_URL}/teachers`, {
      headers: { Authorization: `Bearer ${ctx.jwt}` },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // controller returns { success:false, message } OR { error }
      const msg = json?.message || json?.error || "Failed to load teachers";
      throw new Error(msg);
    }

    const parsed = ListResponse.parse(json);
    return parsed.data;
  }),

  // POST /teachers  (superadmin only)
  add: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        department: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const res = await fetch(`${process.env.API_BASE_URL}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.jwt}`,
        },
        body: JSON.stringify(input),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // unique / validation handled by your errorHandler & controller
        const msg = json?.message || json?.error || "Failed to add teacher";
        throw new Error(msg);
      }

      const parsed = AddResponse.parse(json);
      return parsed.data;
    }),
});
