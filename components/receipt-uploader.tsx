"use client"

import type React from "react"
import { cn } from "@/lib/utils"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ItemsEditor } from "./items-editor"
import { mockExtractItemsFromImage, type ReceiptItem, useReceipts } from "@/lib/local-db"
import { useOcrStatus } from "@/lib/hooks/use-ocr-status"

export function ReceiptUploader() {
  const { addReceipt } = useReceipts()
  const { connected: ocrConnected } = useOcrStatus()
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [selectedFile, setSelectedFile] = useState<File | null>(null) // simpan file asli
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<ReceiptItem[] | null>(null)
  const [ocrText, setOcrText] = useState<string | null>(null) // simpan hasil OCR mentah
  const [loading, setLoading] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setFileUrl(dataUrl)
      setItems(null)
      setOcrText(null) // reset ocrText
    }
    reader.readAsDataURL(f)
    setSelectedFile(f) // simpan file asli untuk dikirim ke OCR
  }

function parseItemsFromText(text: string): ReceiptItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results: ReceiptItem[] = [];

  for (const line of lines) {
    // Skip baris yang mengandung kata kunci non-item
    if (
      /total|subtotal|ppn|tax|cash|kembali|change|payment|thank|date|time|item|qty|harga|rp\s*\d|disc/i.test(line)
    ) {
      continue;
    }

    // Bersihkan koma berlebihan di akhir kata (misal: "ChocoCroissant,")
    let cleanLine = line.replace(/,\s*$/, ""); // hapus koma di akhir

    // Coba deteksi pola: [angka di awal][sisa teks][angka di akhir]
    const match = cleanLine.match(/^(\d+)([^\d].*?)\s+([\d.,]+)$/);
    if (match) {
      const qty = parseInt(match[1], 10);
      let name = match[2].trim();
      const priceStr = match[3];

      // Hapus koma/titik berlebihan di harga
      let priceClean = priceStr.replace(/[^\d,]/g, "");
      // Jika ada koma, anggap sebagai pemisah ribuan → hapus
      if (priceClean.includes(",")) {
        const parts = priceClean.split(",");
        if (parts[1]?.length === 2) {
          // Misal: "10,50" → anggap desimal → 10.50 → bulatkan ke 11? atau simpan sebagai float?
          // Tapi struk biasanya integer → jadi mungkin ini maksudnya 10500
          priceClean = priceClean.replace(",", "");
        } else {
          priceClean = priceClean.replace(",", "");
        }
      }

      const unitPrice = parseFloat(priceClean);
      if (name && qty > 0 && unitPrice > 0) {
        name = name
          .replace(/[-•*|,]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (name.length > 1) {
          results.push({
            id: crypto.randomUUID(),
            name,
            qty: qty,
            price: unitPrice,
            supplierId: undefined,
          });
        }
      }
    }
  }

  console.log("[Parser] Hasil parsing:", results);
  return results;
}

  async function extract() {
    if (!fileUrl || !selectedFile) return
    setLoading(true)
    try {
      console.log("[v0] Starting OCR extraction...")
      const fd = new FormData()
      fd.append("file", selectedFile)

      const res = await fetch("/api/ocr", { method: "POST", body: fd })
      console.log("[v0] OCR response status:", res.status)

      if (res.ok) {
        const data = await res.json()
        console.log("[v0] OCR response data:", data)

        const text = data?.text || data?.ocr || ""
        console.log("[v0] Extracted text length:", text.length)

        if (text) {
          setOcrText(text)
          const parsed = parseItemsFromText(text)
          console.log("[v0] Parsed items count:", parsed.length)

          if (parsed.length > 0) {
            setItems(parsed)
          } else {
            console.log("[v0] No items parsed, using mock fallback")
            const extracted = await mockExtractItemsFromImage(fileUrl)
            setItems(extracted)
          }
        } else {
          console.log("[v0] No text from OCR, using mock fallback")
          const extracted = await mockExtractItemsFromImage(fileUrl)
          setItems(extracted)
        }
      } else {
        console.log("[v0] OCR API error, using mock fallback")
        const extracted = await mockExtractItemsFromImage(fileUrl)
        setItems(extracted)
      }
    } catch (err) {
      console.error("[v0] OCR extraction error:", err)
      const extracted = await mockExtractItemsFromImage(fileUrl)
      setItems(extracted)
    } finally {
      setLoading(false)
    }
  }

  function saveReceipt() {
    if (!items || !fileUrl) return
    const rDate = new Date(date)
    addReceipt({
      title: title || "Nota Baru",
      date: isNaN(rDate.getTime()) ? new Date().toISOString() : rDate.toISOString(),
      imageDataUrl: fileUrl,
      items,
    })
    // reset
    setTitle("")
    setItems(null)
    setOcrText(null) // reset ocr text saat simpan
    setFileUrl(undefined)
    setSelectedFile(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Nota / Struk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Input type="file" accept="image/*" onChange={onFile} />
            <Input
              placeholder="Judul / Nama Nota (opsional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={cn("w-2 h-2 rounded-full", ocrConnected ? "bg-green-500" : "bg-yellow-500")} />
              <span>{ocrConnected ? "OCR siap" : "OCR fallback (mock)"}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={extract} disabled={!fileUrl || !selectedFile || loading}>
                {loading ? "Memproses..." : "Ekstrak Item (OCR)"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setItems(null)
                  setOcrText(null)
                  setFileUrl(undefined)
                  setSelectedFile(null)
                }}
              >
                Reset
              </Button>
            </div>
          </div>
          <div className="border rounded-md bg-muted/30 min-h-48 flex items-center justify-center p-2">
            {fileUrl ? (
              <Image
                src={fileUrl || "/placeholder.svg?height=400&width=400&query=preview%20nota"}
                alt="Pratinjau Nota"
                width={400}
                height={400}
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="text-sm text-muted-foreground">Pratinjau gambar akan tampil di sini</div>
            )}
          </div>
        </div>

        {ocrText && (
          <div className="space-y-2">
            <h3 className="font-semibold">Hasil OCR (mentah)</h3>
            <pre className="text-xs whitespace-pre-wrap bg-muted/40 p-3 rounded-md max-h-64 overflow-auto">
              {ocrText}
            </pre>
          </div>
        )}

        {items && (
          <div className="space-y-3">
            <h3 className="font-semibold">Hasil Ekstraksi (bisa diedit)</h3>
            <ItemsEditor items={items} onChange={setItems} />
            <div className="flex justify-end">
              <Button onClick={saveReceipt} disabled={!fileUrl}>
                Simpan Nota
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
