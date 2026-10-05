import { getStudentSession } from "@/lib/auth/student-session";
import { LearningBookShell } from "@/components/learning-book-shell";

export const dynamic = "force-dynamic";

export default async function LearnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await getStudentSession();
  return <LearningBookShell>{children}</LearningBookShell>;
}
