import { z } from "zod";
import { router, protectedProcedure } from "../index";

// Session schema
const Session = z.object({
  id: z.number(),
  course_id: z.number(),
  teacher_id: z.number(),
  date: z.string(),
  time: z.string(),
  Teacher: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .optional(),
});

const AddResponse = z.object({ success: z.boolean(), data: Session });
const ListResponse = z.object({ success: z.boolean(), data: z.array(Session) });

export const sessionsRouter = router({
  // POST /sessions → schedule new session
  add: protectedProcedure
    .input(
      z.object({
        course_id: z.union([z.string(), z.number()]),
        teacher_id: z.union([z.string(), z.number()]),
        date: z.string(),
        time: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const r = await fetch(`${process.env.API_BASE_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ctx.jwt}`,
        },
        body: JSON.stringify({
          course_id: Number(input.course_id),
          teacher_id: Number(input.teacher_id),
          date: input.date,
          time: input.time,
        }),
      });

      const json = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(json?.message || json?.error || "Failed to schedule session");
      return AddResponse.parse(json).data;
    }),

  // GET /courses/:id/sessions → sessions for course
  byCourse: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const r = await fetch(
        `${process.env.API_BASE_URL}/courses/${input.courseId}/sessions`,
        {
          headers: { Authorization: `Bearer ${ctx.jwt}` },
        }
      );
      const json = await r.json().catch(() => ({}));
      if (!r.ok)
        throw new Error(json?.message || json?.error || "Failed to load sessions");
      return ListResponse.parse(json).data;
    }),
});
