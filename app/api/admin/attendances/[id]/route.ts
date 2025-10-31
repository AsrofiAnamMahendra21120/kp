import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const { error } = await supabase.from("attendances").delete().eq("id", params.id)

    if (error) {
      throw error
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting attendance:", error)
    return Response.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
