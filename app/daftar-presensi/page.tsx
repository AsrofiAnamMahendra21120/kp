"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  MapPin,
  Building2,
  GraduationCap,
  Filter,
  Download,
  Loader2,
} from "lucide-react"

interface Attendance {
  id: string
  name: string
  check_in_time: string
  check_out_time: string | null
  check_in_latitude: number
  check_in_longitude: number
  check_out_latitude: number | null
  check_out_longitude: number | null
  divisions: { name: string }
  campuses: { name: string }
}

interface Division {
  id: string
  name: string
}

export default function DaftarPresensiPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [divisions, setDivisions] = useState<Division[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedDivision, setSelectedDivision] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [totalAttendances, setTotalAttendances] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    loadDivisions()
  }, [])

  useEffect(() => {
    loadAttendances()
  }, [selectedDate, selectedDivision])

  const loadDivisions = async () => {
    try {
      const { data } = await supabase.from("divisions").select("*").order("name")

      setDivisions(data || [])
    } catch (error) {
      console.error("Error loading divisions:", error)
    }
  }

  const loadAttendances = async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from("attendances")
        .select(`
          id,
          name,
          check_in_time,
          check_out_time,
          check_in_latitude,
          check_in_longitude,
          check_out_latitude,
          check_out_longitude,
          divisions(name),
          campuses(name)
        `)
        .gte("check_in_time", `${selectedDate}T00:00:00`)
        .lt("check_in_time", `${selectedDate}T23:59:59`)
        .order("check_in_time", { ascending: false })

      if (selectedDivision !== "all") {
        query = query.eq("division_id", selectedDivision)
      }

      const { data } = await query
      setAttendances(data || [])
      setTotalAttendances(data?.length || 0)
    } catch (error) {
      console.error("Error loading attendances:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateWorkingHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "Belum checkout"

    const checkInTime = new Date(checkIn)
    const checkOutTime = new Date(checkOut)
    const diffMs = checkOutTime.getTime() - checkInTime.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHours}j ${diffMinutes}m`
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

  const exportToCSV = () => {
    const headers = [
      "Nama",
      "Divisi",
      "Kampus",
      "Check-in",
      "Check-out",
      "Durasi Kerja",
      "Koordinat Check-in",
      "Koordinat Check-out",
    ]
    const csvData = attendances.map((attendance) => [
      attendance.name,
      attendance.divisions?.name || "",
      attendance.campuses?.name || "",
      formatTime(attendance.check_in_time),
      attendance.check_out_time ? formatTime(attendance.check_out_time) : "Belum checkout",
      calculateWorkingHours(attendance.check_in_time, attendance.check_out_time),
      `${attendance.check_in_latitude}, ${attendance.check_in_longitude}`,
      attendance.check_out_latitude && attendance.check_out_longitude
        ? `${attendance.check_out_latitude}, ${attendance.check_out_longitude}`
        : "Belum checkout",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `presensi_${selectedDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daftar Presensi</h1>
            <p className="text-gray-600">Lihat dan filter riwayat presensi peserta magang</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Data
            </CardTitle>
            <CardDescription>Pilih tanggal dan divisi untuk melihat data presensi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input id="date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="division">Divisi</Label>
                <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih divisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Divisi</SelectItem>
                    {divisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={exportToCSV}
                variant="outline"
                disabled={attendances.length === 0}
                className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Presensi</p>
                  <p className="text-2xl font-bold text-blue-600">{totalAttendances}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Divisi Aktif</p>
                  <p className="text-2xl font-bold text-green-600">{Object.keys(groupedAttendances).length}</p>
                </div>
                <Building2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sudah Checkout</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {attendances.filter((a) => a.check_out_time).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tanggal</p>
                  <p className="text-sm font-bold text-gray-900">{formatDate(selectedDate)}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Data Presensi - {formatDate(selectedDate)}
            </CardTitle>
            <CardDescription>
              {selectedDivision === "all"
                ? "Menampilkan semua divisi"
                : `Menampilkan divisi: ${divisions.find((d) => d.id === selectedDivision)?.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Memuat data presensi...</span>
              </div>
            ) : Object.keys(groupedAttendances).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Tidak ada data presensi</p>
                <p className="text-sm">Belum ada yang melakukan presensi pada tanggal ini</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedAttendances).map(([division, attendanceList]) => (
                  <div key={division} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                        <Building2 className="h-3 w-3 mr-1" />
                        {division}
                      </Badge>
                      <span className="text-sm text-gray-500">{attendanceList.length} peserta</span>
                    </div>

                    <div className="grid gap-4">
                      {attendanceList.map((attendance) => (
                        <div
                          key={attendance.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">{attendance.name}</h3>
                                {attendance.check_out_time ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Selesai
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-orange-200 text-orange-800">
                                    Aktif
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <GraduationCap className="h-3 w-3" />
                                <span>{attendance.campuses?.name}</span>
                              </div>

                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {attendance.check_in_latitude.toFixed(6)}, {attendance.check_in_longitude.toFixed(6)}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Check-in</p>
                                  <div className="flex items-center gap-1 font-medium text-green-600">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(attendance.check_in_time)}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-gray-500">Check-out</p>
                                  {attendance.check_out_time ? (
                                    <div className="flex items-center gap-1 font-medium text-red-600">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(attendance.check_out_time)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Belum checkout</span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500">Durasi kerja</p>
                                <p className="font-medium text-gray-900">
                                  {calculateWorkingHours(attendance.check_in_time, attendance.check_out_time)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {Object.keys(groupedAttendances).length > 1 && <Separator className="my-6" />}
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
