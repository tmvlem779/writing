import { getStudentSession } from "@/lib/auth/student-session";

export const dynamic = "force-dynamic";

export default async function LearnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await getStudentSession();
  return children;
}
