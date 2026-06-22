import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ConnectionsClient } from "@/components/dashboard/ConnectionsClient"

export default async function ConnectionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login");

  return (
    <ConnectionsClient />
  )
}
