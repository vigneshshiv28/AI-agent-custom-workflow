import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { WorkflowService } from "@/lib/services"
import { DashboardClient } from "@/components/dashboard/DashboardClient"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login");


  const [metrics, workflows] = await Promise.all([
    WorkflowService.getDashboardMetrics(session.user.id),
    WorkflowService.getDashboardWorkflows(session.user.id),
  ]);

  return (
    <DashboardClient
      initialMetrics={metrics}
      initialWorkflows={workflows}
    />
  )
}