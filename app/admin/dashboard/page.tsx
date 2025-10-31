"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, Users, Calendar, BarChart3, Trash2 } from "lucide-react"
import Link from "next/link"

interface Attendance {
  id: string
  name: string
  check_in_time: string
  check_out_time: string | null
  divisions: { name: string }
  campuses: { name: string }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/admin/login")
      return
    }

    fetchAttendances()
  }, [selectedDate])

  const fetchAttendances = async () => {
    try {
      const response = await fetch(`/api/admin/attendances?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin/login")
          return
        }
        throw new Error("Failed to fetch attendances")
      }

      const data = await response.json()
      setAttendances(data)
    } catch (error) {
      console.error("Error fetching attendances:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/")
  }

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data presensi ini?")) return

    try {
      const response = await fetch(`/api/admin/attendances/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete")

      setAttendances(attendances.filter((a) => a.id !== id))
    } catch (error) {
      console.error("Error deleting attendance:", error)
      alert("Gagal menghapus data presensi")
    }
  }

  const groupedAttendances = attendances.reduce(
    (acc, attendance) => {
      const divisionName = attendance.divisions?.name || "Unknown"
      if (!acc[divisionName]) {
        acc[divisionName] = []
      }
      acc[divisionName].push(attendance)
      return acc
    },
    {} as Record<string, Attendance[]>,
  )

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-gray-600 mt-1">Kelola dan pantau data presensi magang</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Presensi</CardTitle>
              <Users className="h-4 w-4 text-blue-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{attendances.length}</div>
              <p className="text-xs text-muted-foreground">Pada tanggal {selectedDate}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Divisi Aktif</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{Object.keys(groupedAttendances).length}</div>
              <p className="text-xs text-muted-foreground">Divisi dengan presensi</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Checkout</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-600 ml-auto" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {attendances.filter((a) => a.check_out_time).length}
              </div>
              <p className="text-xs text-muted-foreground">Peserta yang sudah checkout</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Filter Presensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">Pilih Tanggal</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Link href="/admin/daftar-presensi">
                <Button className="bg-blue-600 hover:bg-blue-700">Lihat Laporan Lengkap</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Attendance List */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Daftar Presensi</CardTitle>
            <CardDescription>
              Data presensi untuk tanggal {new Date(selectedDate).toLocaleDateString("id-ID")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : Object.keys(groupedAttendances).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada data presensi untuk tanggal ini</p>
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
                          <div className="space-y-1 flex-1">
                            <p className="font-medium text-gray-900">{attendance.name}</p>
                            <p className="text-sm text-gray-600">{attendance.campuses?.name}</p>
                          </div>
                          <div className="text-right space-y-1 flex-1">
                            <div className="text-sm">
                              <span className="text-green-600">Masuk: {formatTime(attendance.check_in_time)}</span>
                            </div>
                            {attendance.check_out_time ? (
                              <div className="text-sm">
                                <span className="text-red-600">Keluar: {formatTime(attendance.check_out_time)}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Belum Checkout
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttendance(attendance.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/admin/daftar-presensi">
            <Card className="bg-green-600 hover:bg-green-700 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg text-white">Lihat Semua Presensi</CardTitle>
                <CardDescription className="text-green-100">
                  Filter dan lihat riwayat presensi berdasarkan tanggal dan divisi
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/kelola-data">
            <Card className="bg-green-600 hover:bg-green-700 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg text-white">Kelola Data</CardTitle>
                <CardDescription className="text-green-100">Kelola divisi, kampus, dan lokasi kantor</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
