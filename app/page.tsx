import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Clock, MapPin, Users, Building2 } from "lucide-react"

interface Attendance {
  id: string
  name: string
  check_in_time: string
  check_out_time: string | null
  divisions: { name: string }
  campuses: { name: string }
}

export default async function HomePage() {
  const supabase = await createClient()

  // Get today's attendances with division and campus info
  const today = new Date().toISOString().split("T")[0]
  const { data: attendances } = await supabase
    .from("attendances")
    .select(`
      id,
      name,
      check_in_time,
      check_out_time,
      divisions(name),
      campuses(name)
    `)
    .gte("check_in_time", `${today}T00:00:00`)
    .lt("check_in_time", `${today}T23:59:59`)
    .order("check_in_time", { ascending: false })

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const groupedAttendances =
    attendances?.reduce(
      (acc, attendance) => {
        const divisionName = attendance.divisions?.name || "Unknown"
        if (!acc[divisionName]) {
          acc[divisionName] = []
        }
        acc[divisionName].push(attendance)
        return acc
      },
      {} as Record<string, Attendance[]>,
    ) || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 text-balance">Sistem Presensi Magang</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty">
            Platform digital untuk mencatat kehadiran peserta magang dengan sistem check-in dan check-out berbasis
            lokasi
          </p>
        </div>

        {/* Project Info Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hadir Hari Ini</CardTitle>
              <Users className="h-4 w-4 text-blue-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{attendances?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Peserta magang yang sudah presensi</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Divisi Aktif</CardTitle>
              <Building2 className="h-4 w-4 text-green-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{Object.keys(groupedAttendances).length}</div>
              <p className="text-xs text-muted-foreground">Divisi yang memiliki peserta hadir</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Sistem</CardTitle>
              <MapPin className="h-4 w-4 text-emerald-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">Aktif</div>
              <p className="text-xs text-muted-foreground">Presensi berbasis lokasi tersedia</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="text-center space-y-4">
          <Link href="/presensi">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              <Clock className="mr-2 h-5 w-5" />
              Lakukan Presensi
            </Button>
          </Link>
          <div>
            <p className="text-sm text-gray-600 mb-2">Atau</p>
            <Link href="/admin/login">
              <Button variant="outline" size="lg" className="px-8 py-3 bg-transparent">
                Login Admin
              </Button>
            </Link>
          </div>
        </div>

        {/* Today's Attendance List */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Presensi Hari Ini
            </CardTitle>
            <CardDescription>
              Peserta magang yang telah melakukan presensi pada{" "}
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedAttendances).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada yang melakukan presensi hari ini</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAttendances).map(([division, attendanceList]) => (
                  <div key={division} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {division}
                      </Badge>
                      <span className="text-sm text-gray-500">{attendanceList.length} peserta</span>
                    </div>
                    <div className="grid gap-3">
                      {attendanceList.map((attendance) => (
                        <div
                          key={attendance.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{attendance.name}</p>
                            <p className="text-sm text-gray-600">{attendance.campuses?.name}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              <span className="text-green-600">Masuk: {formatTime(attendance.check_in_time)}</span>
                            </div>
                            {attendance.check_out_time ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3" />
                                <span className="text-red-600">Keluar: {formatTime(attendance.check_out_time)}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Belum Check-out
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
