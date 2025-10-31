import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    })

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    const { data: result, error } = await supabase
      .from("attendances")
      .select(
        `
        id,
        name,
        check_in_time,
        check_out_time,
        divisions(name),
        campuses(name)
      `,
      )
      .gte("check_in_time", `${date}T00:00:00`)
      .lt("check_in_time", `${date}T23:59:59`)
      .order("check_in_time", { ascending: false })

    if (error) {
      throw error
    }

    return Response.json(result)
  } catch (error) {
    console.error("Error fetching attendances:", error)
    return Response.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
