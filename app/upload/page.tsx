"use client"

import { AppHeader } from "@/components/app-header"
import { ReceiptUploader } from "@/components/receipt-uploader"
import { useReceipts } from "@/lib/local-db"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function UploadPage() {
  const { receipts, removeReceipt } = useReceipts()

  return (
    <main>
      <AppHeader />
      <section className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <ReceiptUploader />

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Nota Tersimpan</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {receipts.map((r) => (
              <div key={r.id} className="border rounded-md p-3 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.date).toLocaleString()}</div>
                  </div>
                  <Button variant="destructive" onClick={() => removeReceipt(r.id)}>
                    Hapus
                  </Button>
                </div>
                {r.imageDataUrl && (
                  <div className="mt-2">
                    <Image
                      src={r.imageDataUrl || "/placeholder.svg"}
                      alt="Nota"
                      width={600}
                      height={400}
                      className="w-full h-auto object-contain rounded"
                    />
                  </div>
                )}
                <div className="mt-2 text-sm text-muted-foreground">{r.items.length} item</div>
              </div>
            ))}
            {receipts.length === 0 && <div className="text-sm text-muted-foreground">Belum ada nota tersimpan.</div>}
          </div>
        </div>
      </section>
    </main>
  )
}
