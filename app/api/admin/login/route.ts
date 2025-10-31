import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ error: "Email dan password harus diisi" }, { status: 400 })
    }

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

    const { data: adminData, error: queryError } = await supabase
      .from("admin_users")
      .select("id, email, password, name, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    if (queryError || !adminData) {
      return Response.json({ error: "Email atau password salah" }, { status: 401 })
    }

    if (password !== adminData.password) {
      return Response.json({ error: "Email atau password salah" }, { status: 401 })
    }

    const token = Buffer.from(`${adminData.id}:${Date.now()}`).toString("base64")

    return Response.json({
      token,
      admin: { id: adminData.id, email: adminData.email, name: adminData.name },
    })
  } catch (error) {
    console.error("Login error:", error)
    return Response.json({ error: "Terjadi kesalahan saat login" }, { status: 500 })
  }
}
