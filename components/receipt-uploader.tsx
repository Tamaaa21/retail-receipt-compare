"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ItemsEditor } from "./items-editor"
import { type ReceiptItem, useReceipts } from "@/lib/local-db"
import { useOcrStatus } from "@/lib/hooks/use-ocr-status"

export function ReceiptUploader() {
  const { addReceipt } = useReceipts()
  const { connected: ocrConnected } = useOcrStatus()
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<ReceiptItem[] | null>(null)
  const [ocrText, setOcrText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setFileUrl(dataUrl)
      setItems(null)
      setOcrText(null)
    }
    reader.readAsDataURL(f)
    setSelectedFile(f)
  }

  function parseItemsFromText(text: string): ReceiptItem[] {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const results: ReceiptItem[] = []

    function parsePrice(priceStr: string): number {
      if (!priceStr) return 0
      let normalized = priceStr.replace(/\s/g, "").replace(/[^0-9.,]/g, "")
      if (normalized.includes(".")) {
        normalized = normalized.replace(/\./g, "").replace(",", ".")
      } else if (normalized.includes(",")) {
        const parts = normalized.split(",")
        if (parts[1]?.length === 2) {
          normalized = normalized.replace(",", ".")
        } else {
          normalized = normalized.replace(",", "")
        }
      }
      const price = parseFloat(normalized)
      return isFinite(price) ? price : 0
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Skip baris yang jelas bukan item
      if (
        /total|subtotal|ppn|tax|cash|kembali|change|payment|thank|date|time|item|qty|harga|rp\s*\d|disc|subtotal|total|rupiah|no\.|jalan|telp|shop|thank you|payment|balance|discount/i.test(line)
      ) {
        continue
      }

      // ✅ Pola 1: Nama di baris ini, qty x harga di baris berikutnya
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const matchQtyPrice = nextLine.match(/^(\d+)[xX]([\d.,]+)/)
        if (matchQtyPrice) {
          const qty = parseInt(matchQtyPrice[1], 10)
          const price = parsePrice(matchQtyPrice[2])
          if (price > 0) {
            let name = line.trim()
            name = name
              .replace(/[-•*|,]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
            if (name.length > 1) {
              results.push({
                id: crypto.randomUUID(),
                name,
                qty: qty,
                price: price,
                supplierId: undefined,
              })
              i++ // skip baris harga
              continue
            }
          }
        }
      }

      // ✅ Pola 2: Qty di awal, nama, harga di akhir (format sederhana)
      const matchSimple = line.match(/^(\d+)\s+(.+?)\s+([\d.,]+)$/)
      if (matchSimple) {
        const qty = parseInt(matchSimple[1], 10)
        let name = matchSimple[2].trim()
        const price = parsePrice(matchSimple[3])
        if (name && qty > 0 && price > 0) {
          name = name
            .replace(/[-•*|,]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
          if (name.length > 1) {
            results.push({
              id: crypto.randomUUID(),
              name,
              qty: qty,
              price: price,
              supplierId: undefined,
            })
          }
          continue
        }
      }

      // ✅ Pola 3: Nama + harga (qty=1)
      const matchNamePrice = line.match(/^(.+?)\s+([\d.,]+)$/)
      if (matchNamePrice) {
        let name = matchNamePrice[1].trim()
        const price = parsePrice(matchNamePrice[2])
        if (name && price > 0) {
          name = name
            .replace(/[-•*|,]+/g, " ")
            .replace(/\s+/g, " ")
            .trim()
          if (name.length > 1) {
            results.push({
              id: crypto.randomUUID(),
              name,
              qty: 1,
              price: price,
              supplierId: undefined,
            })
          }
        }
      }
    }

    console.log("[Parser] Hasil parsing:", results)
    return results
  }

  async function extract() {
    if (!fileUrl || !selectedFile) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", selectedFile)

      const res = await fetch("/api/ocr", { method: "POST", body: fd })

      if (res.ok) {
        const data = await res.json()
        const text = data?.text || data?.ocr || ""

        if (text) {
          setOcrText(text)
          const parsed = parseItemsFromText(text)
          setItems(parsed.length > 0 ? parsed : []) // ❗ jangan fallback ke mock!
        } else {
          setItems([])
        }
      } else {
        setItems([])
      }
    } catch (err) {
      console.error("[OCR] Error:", err)
      setItems([]) // ❗ jangan fallback ke mock
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
    setTitle("")
    setItems(null)
    setOcrText(null)
    setFileUrl(undefined)
    setSelectedFile(null)
  }

  return (
    <Card className="mt-25">
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
                src={fileUrl}
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