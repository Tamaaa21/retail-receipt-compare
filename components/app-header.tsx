"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useOcrStatus } from "@/lib/hooks/use-ocr-status"
import { useState } from "react"
import { Menu, X, Server } from "lucide-react"

const links = [
  { href: "/", label: "Beranda" },
  { href: "/upload", label: "Upload Nota" },
  { href: "/suppliers", label: "Supplier" },
  { href: "/compare", label: "Perbandingan" },
]

export function AppHeader() {
  const pathname = usePathname()
  const { connected, message } = useOcrStatus()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-purple-500 to-pink-500" aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
            <Image
              src="/placeholder-logo.svg"
              alt="Retail Nota Compare"
              width={32}
              height={32}
              className="rounded-sm"
              priority
            />
            <span className="font-bold text-lg text-primary">Retail Nota Compare</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative px-2 py-1 text-sm font-medium transition-colors nav-link",
                  pathname === l.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
            {/* OCR Status Indicator for Desktop */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium bg-muted/50"
              title={message}
            >
              <Server className="w-3 h-3" />
              <div
                className={cn("w-2 h-2 rounded-full animate-pulse", connected ? "bg-green-500" : "bg-red-500")}
                aria-label={connected ? "Backend terhubung" : "Backend tidak terhubung"}
              />
              <span className="text-muted-foreground">{connected ? "OCR Aktif" : "OCR Offline"}</span>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Menu Panel */}
          <nav className="fixed top-0 left-0 right-0 p-4 bg-card border-b shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/placeholder-logo.svg"
                  alt="Retail Nota Compare"
                  width={32}
                  height={32}
                  className="rounded-sm"
                />
                <span className="font-bold text-lg text-primary">Retail Nota Compare</span>
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    pathname === l.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}