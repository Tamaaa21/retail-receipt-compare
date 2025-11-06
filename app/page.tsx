"use client"

import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useReceipts, useSuppliers } from "@/lib/local-db"
import { Store, Receipt, Package, ArrowRight, Upload, BarChart3 } from "lucide-react"

// Komponen untuk Kartu Statistik
function StatCard({ title, value, description, icon: Icon, href, linkText }: {
  title: string;
  value: number | string;
  description: string;
  icon: any;
  href: string;
  linkText: string;
}) {
  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <Link
          href={href}
          className="absolute inset-x-0 bottom-0 bg-primary/10 text-primary text-xs font-medium p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-1"
        >
          {linkText}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

// Komponen untuk Kartu Langkah
function StepCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{children}</p>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { receipts } = useReceipts()
  const { suppliers } = useSuppliers()
  const totalItems = receipts.reduce((acc, r) => acc + r.items.length, 0)

  return (
    <main>
      <AppHeader />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="mx-auto max-w-5xl px-4 py-12 space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-balance">
              Bandingkan Harga Nota Retail dengan Mudah
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Kelola supplier, upload nota, dan temukan harga terbaik untuk setiap item belanjaan Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link href="/upload">
                <Button size="lg" className="w-full sm:w-auto">
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Nota Baru
                </Button>
              </Link>
              <Link href="/compare">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Lihat Perbandingan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <StatCard
            title="Supplier"
            value={suppliers.length}
            description="Total supplier terdaftar"
            icon={Store}
            href="/suppliers"
            linkText="Kelola Supplier"
          />
          <StatCard
            title="Nota"
            value={receipts.length}
            description="Total nota tersimpan"
            icon={Receipt}
            href="/upload"
            linkText="Tambah Nota"
          />
          <StatCard
            title="Item"
            value={totalItems}
            description="Total item terekstrak"
            icon={Package}
            href="/compare"
            linkText="Bandingkan Harga"
          />
        </div>

        {/* Quick Steps Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Cara Memulai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StepCard number={1} title="Daftarkan Supplier">
              Tambahkan data toko atau supplier tempat Anda biasa berbelanja.
            </StepCard>
            <StepCard number={2} title="Upload Nota">
              Unggah foto atau scan nota. Sistem akan mengekstrak item dan harganya secara otomatis.
            </StepCard>
            <StepCard number={3} title="Bandingkan & Simpan">
              Sesuaikan hasil ekstraksi jika perlu, lalu simpan. Lihat perbandingan harga untuk menemukan penawaran terbaik.
            </StepCard>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}