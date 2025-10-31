"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface Division {
  id: string
  name: string
}

interface Campus {
  id: string
  name: string
}

interface LocationCoords {
  latitude: number
  longitude: number
}

interface OfficeLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  radius: number
  is_active: boolean
}

export default function PresensiPage() {
  const [name, setName] = useState("")
  const [selectedDivision, setSelectedDivision] = useState("")
  const [selectedCampus, setSelectedCampus] = useState("")
  const [divisions, setDivisions] = useState<Division[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [existingAttendance, setExistingAttendance] = useState<any>(null)
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([])
  const [isLoadingOfficeLocations, setIsLoadingOfficeLocations] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadDivisionsAndCampuses()
    loadOfficeLocations()
    getCurrentLocation()
  }, [])

  const loadDivisionsAndCampuses = async () => {
    try {
      const [divisionsResult, campusesResult] = await Promise.all([
        supabase.from("divisions").select("*").order("name"),
        supabase.from("campuses").select("*").order("name"),
      ])

      if (divisionsResult.data) setDivisions(divisionsResult.data)
      if (campusesResult.data) setCampuses(campusesResult.data)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const loadOfficeLocations = async () => {
    try {
      setIsLoadingOfficeLocations(true)
      const { data, error } = await supabase.from("office_locations").select("*").eq("is_active", true).order("name")

      if (error) throw error
      if (data) setOfficeLocations(data)
    } catch (error) {
      console.error("Error loading office locations:", error)
      setLocationError("Gagal memuat lokasi kantor")
    } finally {
      setIsLoadingOfficeLocations(false)
    }
  }

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser ini")
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setCurrentLocation(coords)
        setIsLoadingLocation(false)
      },
      (error) => {
        let errorMessage = "Gagal mendapatkan lokasi"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak. Silakan izinkan akses lokasi."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia."
            break
          case error.TIMEOUT:
            errorMessage = "Timeout mendapatkan lokasi."
            break
        }
        setLocationError(errorMessage)
        setIsLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const isLocationValid = (): boolean => {
    if (!currentLocation || officeLocations.length === 0) return false

    return officeLocations.some((office) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        office.latitude,
        office.longitude,
      )
      return distance <= office.radius
    })
  }

  const getNearestOfficeLocation = (): OfficeLocation | null => {
    if (!currentLocation || officeLocations.length === 0) return null

    let nearestOffice = officeLocations[0]
    let minDistance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      nearestOffice.latitude,
      nearestOffice.longitude,
    )

    officeLocations.forEach((office) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        office.latitude,
        office.longitude,
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestOffice = office
      }
    })

    return nearestOffice
  }

  const checkExistingAttendance = async () => {
    if (!name || !selectedDivision || !selectedCampus) return

    const today = new Date().toISOString().split("T")[0]
    const { data } = await supabase
      .from("attendances")
      .select("*")
      .eq("name", name)
      .eq("division_id", selectedDivision)
      .eq("campus_id", selectedCampus)
      .gte("check_in_time", `${today}T00:00:00`)
      .lt("check_in_time", `${today}T23:59:59`)
      .single()

    setExistingAttendance(data)
  }

  useEffect(() => {
    checkExistingAttendance()
  }, [name, selectedDivision, selectedCampus])

  const handleSubmit = async (action: "checkin" | "checkout") => {
    if (!name || !selectedDivision || !selectedCampus) {
      setSubmitMessage({ type: "error", message: "Mohon lengkapi semua data" })
      return
    }

    if (!currentLocation) {
      setSubmitMessage({ type: "error", message: "Lokasi belum terdeteksi" })
      return
    }

    if (!isLocationValid()) {
      setSubmitMessage({ type: "error", message: "Anda berada di luar area yang diizinkan untuk presensi" })
      return
    }

    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      if (action === "checkin") {
        const { error } = await supabase.from("attendances").insert({
          name,
          division_id: selectedDivision,
          campus_id: selectedCampus,
          check_in_latitude: currentLocation.latitude,
          check_in_longitude: currentLocation.longitude,
          check_in_time: new Date().toISOString(),
        })

        if (error) throw error
        setSubmitMessage({ type: "success", message: "Check-in berhasil!" })
      } else {
        if (!existingAttendance) {
          setSubmitMessage({ type: "error", message: "Tidak ditemukan data check-in hari ini" })
          return
        }

        const { error } = await supabase
          .from("attendances")
          .update({
            check_out_time: new Date().toISOString(),
            check_out_latitude: currentLocation.latitude,
            check_out_longitude: currentLocation.longitude,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAttendance.id)

        if (error) throw error
        setSubmitMessage({ type: "success", message: "Check-out berhasil!" })
      }

      await checkExistingAttendance()
    } catch (error) {
      console.error("Error:", error)
      setSubmitMessage({ type: "error", message: "Terjadi kesalahan. Silakan coba lagi." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrentTime = () => {
    return new Date().toLocaleString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (isLoadingOfficeLocations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-lg font-medium">Memuat konfigurasi lokasi...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Presensi</h1>
            <p className="text-gray-600">Lakukan check-in atau check-out</p>
          </div>
        </div>

        {/* Current Time */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-medium">{formatCurrentTime()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location Status */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Status Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLocation ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mendapatkan lokasi...</span>
              </div>
            ) : locationError ? (
              <div className="space-y-3">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{locationError}</AlertDescription>
                </Alert>
                <Button onClick={getCurrentLocation} variant="outline" size="sm">
                  Coba Lagi
                </Button>
              </div>
            ) : currentLocation ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {isLocationValid() ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Lokasi Valid
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <Badge variant="destructive">Di Luar Area</Badge>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Koordinat: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </p>
                {(() => {
                  const nearestOffice = getNearestOfficeLocation()
                  if (nearestOffice) {
                    const distance = calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      nearestOffice.latitude,
                      nearestOffice.longitude,
                    )
                    return (
                      <p className="text-sm text-gray-600">
                        Jarak ke {nearestOffice.name}: {Math.round(distance)} meter
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Data Presensi</CardTitle>
            <CardDescription>Lengkapi data berikut untuk melakukan presensi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Divisi</Label>
              <Select value={selectedDivision} onValueChange={setSelectedDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((division) => (
                    <SelectItem key={division.id} value={division.id}>
                      {division.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campus">Asal Kampus</Label>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih asal kampus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {submitMessage && (
              <Alert className={submitMessage.type === "success" ? "border-green-200 bg-green-50" : ""}>
                {submitMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription className={submitMessage.type === "success" ? "text-green-800" : ""}>
                  {submitMessage.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {!existingAttendance ? (
                <Button
                  onClick={() => handleSubmit("checkin")}
                  disabled={
                    isSubmitting ||
                    !currentLocation ||
                    !isLocationValid() ||
                    !name ||
                    !selectedDivision ||
                    !selectedCampus
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check-in
                    </>
                  )}
                </Button>
              ) : !existingAttendance.check_out_time ? (
                <Button
                  onClick={() => handleSubmit("checkout")}
                  disabled={isSubmitting || !currentLocation || !isLocationValid()}
                  className="flex-1 bg-blue-800 hover:bg-blue-900"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check-out
                    </>
                  )}
                </Button>
              ) : (
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Anda sudah menyelesaikan presensi hari ini
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {existingAttendance && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Status Presensi Hari Ini:</p>
                <p className="text-sm text-gray-600">
                  Check-in: {new Date(existingAttendance.check_in_time).toLocaleTimeString("id-ID")}
                </p>
                {existingAttendance.check_out_time && (
                  <p className="text-sm text-gray-600">
                    Check-out: {new Date(existingAttendance.check_out_time).toLocaleTimeString("id-ID")}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
