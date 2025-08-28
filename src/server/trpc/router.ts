import { router } from "./index";
import { authRouter } from "./routers/auth";
import { studentsRouter } from "./routers/students";
import { teachersRouter } from "./routers/teachers";
import { coursesRouter } from "./routers/courses";
import { sessionsRouter } from "./routers/session";

export const appRouter = router({
  auth: authRouter,
  students: studentsRouter,
  teachers: teachersRouter,
  courses: coursesRouter,
  sessions: sessionsRouter,
});
export type AppRouter = typeof appRouter;
