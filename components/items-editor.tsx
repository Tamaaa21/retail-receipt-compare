"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import type { ReceiptItem } from "@/lib/local-db"
import { SupplierSelect } from "./supplier-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Props = {
  items: ReceiptItem[]
  onChange: (items: ReceiptItem[]) => void
}

export function ItemsEditor({ items, onChange }: Props) {
  const [local, setLocal] = useState<ReceiptItem[]>(items)

  function commit(next: ReceiptItem[]) {
    setLocal(next)
    onChange(next)
  }

  function updateField(id: string, patch: Partial<ReceiptItem>) {
    const next = local.map((it) => (it.id === id ? { ...it, ...patch } : it))
    commit(next)
  }

  function addRow() {
    const next = [
      ...local,
      {
        id: crypto.randomUUID(),
        name: "",
        qty: 1,
        price: 0,
        supplierId: undefined,
      },
    ]
    commit(next)
  }

  function removeRow(id: string) {
    const next = local.filter((it) => it.id !== id)
    commit(next)
  }

  // Menghitung total untuk ringkasan
  const totalQty = local.reduce((sum, item) => sum + (item.qty || 0), 0)
  const totalPrice = local.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0)

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header Tabel (Desktop) */}
        <div className="hidden grid-cols-12 gap-4 px-4 text-sm font-medium text-muted-foreground lg:grid">
          <div className="col-span-5">Item</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-center">Harga</div>
          <div className="col-span-2">Supplier</div>
          <div className="col-span-1 text-center">Aksi</div>
        </div>

        {/* Daftar Item */}
        <div className="rounded-lg border bg-card shadow-sm">
          {local.map((it, index) => (
            <div
              key={it.id}
              className={cn(
                "grid grid-cols-12 gap-4 p-4 transition-colors hover:bg-muted/30",
                index !== local.length - 1 && "border-b",
              )}
            >
              {/* Nama Item */}
              <div className="col-span-12 lg:col-span-5">
                <label className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">
                  Nama Item
                </label>
                <Input
                  value={it.name}
                  onChange={(e) => updateField(it.id, { name: e.target.value })}
                  placeholder="Nama item"
                />
              </div>

              {/* Kuantitas */}
              <div className="col-span-4 lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">
                  Kuantitas
                </label>
                <Input
                  type="number"
                  min={0}
                  value={String(it.qty)}
                  onChange={(e) =>
                    updateField(it.id, {
                      qty: Number(e.target.value) || 0,
                    })
                  }
                  className="text-center"
                />
              </div>

              {/* Harga */}
              <div className="col-span-4 lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">
                  Harga
                </label>
                <Input
                  type="number"
                  min={0}
                  value={String(it.price)}
                  onChange={(e) =>
                    updateField(it.id, {
                      price: Number(e.target.value) || 0,
                    })
                  }
                  className="text-center"
                />
              </div>

              {/* Supplier */}
              <div className="col-span-8 lg:col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted-foreground lg:hidden">
                  Supplier
                </label>
                <SupplierSelect
                  value={it.supplierId}
                  onChange={(supplierId) => updateField(it.id, { supplierId })}
                />
              </div>

              {/* Tombol Hapus */}
              <div className="col-span-4 flex items-center justify-end lg:col-span-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(it.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hapus Item</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>

        {/* Ringkasan Total */}
        <div className="flex flex-col rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-x-6 text-sm text-muted-foreground">
            <span>
              Total Item: <strong className="text-foreground">{totalQty}</strong>
            </span>
            <span>
              Total Harga: <strong className="text-foreground">Rp {totalPrice.toLocaleString("id-ID")}</strong>
            </span>
          </div>
          <Button onClick={addRow} className="mt-3 w-full sm:mt-0 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Baris
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}