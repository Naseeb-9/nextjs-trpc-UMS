import { z } from "zod";
import { router, protectedProcedure } from "../index";

const Course = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string().nullable().optional(),
});

const Student = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  roll_number: z.string(),
  department: z.string(),
  // Backend include alias is 'Courses'
  Courses: z.array(Course).optional(),
});

// Backend returns { success: true, data: [...] }
const ListResponse = z.object({
  success: z.boolean(),
  data: z.array(Student),
});

// Backend returns { success: true, data: {...} }
const AddResponse = z.object({
  success: z.boolean(),
  data: Student,
});

export const studentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const res = await fetch(`${process.env.API_BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${ctx.jwt}` },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // errorHandler default: { success:false, message: "..." }
      const msg = json?.message || json?.error || "Failed to load students";
      throw new Error(msg);
    }

    const parsed = ListResponse.parse(json);
    return parsed.data;
  }),

  add: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        roll_number: z.string().min(1),
        department: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const res = await fetch(`${process.env.API_BASE_URL}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.jwt}`,
        },
        body: JSON.stringify(input),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Sequelize/validation errors → errorHandler.js sends { success:false, message: "..." }
        const msg = json?.message || json?.error || "Failed to add student";
        throw new Error(msg);
      }

      const parsed = AddResponse.parse(json);
      return parsed.data;
    }),
});
