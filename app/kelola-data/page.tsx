"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft, Plus, Building2, GraduationCap, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface Division {
  id: string
  name: string
  created_at: string
}

interface Campus {
  id: string
  name: string
  created_at: string
}

export default function KelolaDataPage() {
  const [divisions, setDivisions] = useState<Division[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [newDivisionName, setNewDivisionName] = useState("")
  const [newCampusName, setNewCampusName] = useState("")
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(true)
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(true)
  const [isSubmittingDivision, setIsSubmittingDivision] = useState(false)
  const [isSubmittingCampus, setIsSubmittingCampus] = useState(false)
  const [divisionMessage, setDivisionMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [campusMessage, setCampusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadDivisions()
    loadCampuses()
  }, [])

  const loadDivisions = async () => {
    try {
      setIsLoadingDivisions(true)
      const { data, error } = await supabase.from("divisions").select("*").order("name")

      if (error) throw error
      setDivisions(data || [])
    } catch (error) {
      console.error("Error loading divisions:", error)
      setDivisionMessage({ type: "error", message: "Gagal memuat data divisi" })
    } finally {
      setIsLoadingDivisions(false)
    }
  }

  const loadCampuses = async () => {
    try {
      setIsLoadingCampuses(true)
      const { data, error } = await supabase.from("campuses").select("*").order("name")

      if (error) throw error
      setCampuses(data || [])
    } catch (error) {
      console.error("Error loading campuses:", error)
      setCampusMessage({ type: "error", message: "Gagal memuat data kampus" })
    } finally {
      setIsLoadingCampuses(false)
    }
  }

  const handleAddDivision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDivisionName.trim()) {
      setDivisionMessage({ type: "error", message: "Nama divisi tidak boleh kosong" })
      return
    }

    setIsSubmittingDivision(true)
    setDivisionMessage(null)

    try {
      const { error } = await supabase.from("divisions").insert({ name: newDivisionName.trim() })

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          throw new Error("Divisi dengan nama tersebut sudah ada")
        }
        throw error
      }

      setDivisionMessage({ type: "success", message: "Divisi berhasil ditambahkan" })
      setNewDivisionName("")
      await loadDivisions()
    } catch (error: any) {
      setDivisionMessage({ type: "error", message: error.message || "Gagal menambahkan divisi" })
    } finally {
      setIsSubmittingDivision(false)
    }
  }

  const handleAddCampus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampusName.trim()) {
      setCampusMessage({ type: "error", message: "Nama kampus tidak boleh kosong" })
      return
    }

    setIsSubmittingCampus(true)
    setCampusMessage(null)

    try {
      const { error } = await supabase.from("campuses").insert({ name: newCampusName.trim() })

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          throw new Error("Kampus dengan nama tersebut sudah ada")
        }
        throw error
      }

      setCampusMessage({ type: "success", message: "Kampus berhasil ditambahkan" })
      setNewCampusName("")
      await loadCampuses()
    } catch (error: any) {
      setCampusMessage({ type: "error", message: error.message || "Gagal menambahkan kampus" })
    } finally {
      setIsSubmittingCampus(false)
    }
  }

  const handleDeleteDivision = async (divisionId: string, divisionName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus divisi "${divisionName}"?`)) {
      return
    }

    try {
      // Check if division is used in attendances
      const { data: attendances } = await supabase
        .from("attendances")
        .select("id")
        .eq("division_id", divisionId)
        .limit(1)

      if (attendances && attendances.length > 0) {
        setDivisionMessage({
          type: "error",
          message: "Tidak dapat menghapus divisi yang sudah digunakan dalam presensi",
        })
        return
      }

      const { error } = await supabase.from("divisions").delete().eq("id", divisionId)

      if (error) throw error

      setDivisionMessage({ type: "success", message: "Divisi berhasil dihapus" })
      await loadDivisions()
    } catch (error: any) {
      setDivisionMessage({ type: "error", message: error.message || "Gagal menghapus divisi" })
    }
  }

  const handleDeleteCampus = async (campusId: string, campusName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kampus "${campusName}"?`)) {
      return
    }

    try {
      // Check if campus is used in attendances
      const { data: attendances } = await supabase.from("attendances").select("id").eq("campus_id", campusId).limit(1)

      if (attendances && attendances.length > 0) {
        setCampusMessage({
          type: "error",
          message: "Tidak dapat menghapus kampus yang sudah digunakan dalam presensi",
        })
        return
      }

      const { error } = await supabase.from("campuses").delete().eq("id", campusId)

      if (error) throw error

      setCampusMessage({ type: "success", message: "Kampus berhasil dihapus" })
      await loadCampuses()
    } catch (error: any) {
      setCampusMessage({ type: "error", message: error.message || "Gagal menghapus kampus" })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kelola Data</h1>
            <p className="text-gray-600">Tambah dan kelola divisi serta asal kampus</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Divisions Management */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Kelola Divisi
              </CardTitle>
              <CardDescription>Tambah divisi baru untuk sistem presensi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Division Form */}
              <form onSubmit={handleAddDivision} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="division-name">Nama Divisi</Label>
                  <Input
                    id="division-name"
                    value={newDivisionName}
                    onChange={(e) => setNewDivisionName(e.target.value)}
                    placeholder="Masukkan nama divisi"
                    disabled={isSubmittingDivision}
                  />
                </div>
                <Button type="submit" disabled={isSubmittingDivision || !newDivisionName.trim()} className="w-full">
                  {isSubmittingDivision ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menambahkan...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Divisi
                    </>
                  )}
                </Button>
              </form>

              {divisionMessage && (
                <Alert className={divisionMessage.type === "success" ? "border-green-200 bg-green-50" : ""}>
                  {divisionMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className={divisionMessage.type === "success" ? "text-green-800" : ""}>
                    {divisionMessage.message}
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Divisions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Daftar Divisi</h3>
                  <Badge variant="secondary">{divisions.length} divisi</Badge>
                </div>

                {isLoadingDivisions ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">Memuat data...</span>
                  </div>
                ) : divisions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada divisi</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {divisions.map((division) => (
                      <div key={division.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{division.name}</p>
                          <p className="text-xs text-gray-500">
                            Dibuat: {new Date(division.created_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDivision(division.id, division.name)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campuses Management */}
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Kelola Kampus
              </CardTitle>
              <CardDescription>Tambah asal kampus baru untuk sistem presensi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Campus Form */}
              <form onSubmit={handleAddCampus} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="campus-name">Nama Kampus</Label>
                  <Input
                    id="campus-name"
                    value={newCampusName}
                    onChange={(e) => setNewCampusName(e.target.value)}
                    placeholder="Masukkan nama kampus"
                    disabled={isSubmittingCampus}
                  />
                </div>
                <Button type="submit" disabled={isSubmittingCampus || !newCampusName.trim()} className="w-full">
                  {isSubmittingCampus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menambahkan...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Kampus
                    </>
                  )}
                </Button>
              </form>

              {campusMessage && (
                <Alert className={campusMessage.type === "success" ? "border-green-200 bg-green-50" : ""}>
                  {campusMessage.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className={campusMessage.type === "success" ? "text-green-800" : ""}>
                    {campusMessage.message}
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Campuses List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Daftar Kampus</h3>
                  <Badge variant="secondary">{campuses.length} kampus</Badge>
                </div>

                {isLoadingCampuses ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">Memuat data...</span>
                  </div>
                ) : campuses.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada kampus</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {campuses.map((campus) => (
                      <div key={campus.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{campus.name}</p>
                          <p className="text-xs text-gray-500">
                            Dibuat: {new Date(campus.created_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCampus(campus.id, campus.name)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
