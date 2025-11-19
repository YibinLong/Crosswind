import { redirect } from "next/navigation"

export default function DashboardFlightRescheduleRedirect({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/flights/${params.id}/reschedule`)
}





