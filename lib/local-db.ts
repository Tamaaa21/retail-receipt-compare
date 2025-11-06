"use client"

import useSWR, { mutate } from "swr"

export type Supplier = {
  id: string
  name: string
}

export type ReceiptItem = {
  id: string
  name: string
  qty: number
  price: number
  supplierId?: string
}

export type Receipt = {
  id: string
  title: string
  date: string // ISO string
  imageDataUrl?: string
  items: ReceiptItem[]
}

const KEYS = {
  suppliers: "retail_suppliers_v1",
  receipts: "retail_receipts_v1",
}

// helpers
function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
function writeLocal<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val))
}

const fetcher = (key: string) => {
  if (typeof window === "undefined") return null
  switch (key) {
    case KEYS.suppliers:
      return readLocal<Supplier[]>(KEYS.suppliers, [])
    case KEYS.receipts:
      return readLocal<Receipt[]>(KEYS.receipts, [])
    default:
      return null
  }
}

export function useSuppliers() {
  const { data, error, isLoading } = useSWR<Supplier[]>(KEYS.suppliers, fetcher, {
    fallbackData: [],
  })
  return {
    suppliers: data ?? [],
    isLoading,
    error,
    addSupplier: (name: string) => {
      const id = crypto.randomUUID()
      const next = [...(data ?? []), { id, name }]
      writeLocal(KEYS.suppliers, next)
      mutate(KEYS.suppliers, next, false)
      return id
    },
    renameSupplier: (id: string, name: string) => {
      const next = (data ?? []).map((s) => (s.id === id ? { ...s, name } : s))
      writeLocal(KEYS.suppliers, next)
      mutate(KEYS.suppliers, next, false)
    },
    removeSupplier: (id: string) => {
      const next = (data ?? []).filter((s) => s.id !== id)
      writeLocal(KEYS.suppliers, next)
      mutate(KEYS.suppliers, next, false)
      // Juga lepas referensi supplier dari items di semua receipts
      const receipts = readLocal<Receipt[]>(KEYS.receipts, [])
      const cleaned = receipts.map((r) => ({
        ...r,
        items: r.items.map((it) => (it.supplierId === id ? { ...it, supplierId: undefined } : it)),
      }))
      writeLocal(KEYS.receipts, cleaned)
      mutate(KEYS.receipts, cleaned, false)
    },
  }
}

export function useReceipts() {
  const { data, error, isLoading } = useSWR<Receipt[]>(KEYS.receipts, fetcher, {
    fallbackData: [],
  })
  return {
    receipts: data ?? [],
    isLoading,
    error,
    addReceipt: (r: Omit<Receipt, "id">) => {
      const id = crypto.randomUUID()
      const next = [...(data ?? []), { ...r, id }]
      writeLocal(KEYS.receipts, next)
      mutate(KEYS.receipts, next, false)
      return id
    },
    updateReceipt: (id: string, patch: Partial<Receipt>) => {
      const next = (data ?? []).map((rec) => (rec.id === id ? { ...rec, ...patch } : rec))
      writeLocal(KEYS.receipts, next)
      mutate(KEYS.receipts, next, false)
    },
    removeReceipt: (id: string) => {
      const next = (data ?? []).filter((rec) => rec.id !== id)
      writeLocal(KEYS.receipts, next)
      mutate(KEYS.receipts, next, false)
    },
  }
}

// Mock ekstraksi item dari gambar (sebagai placeholder OCR)
export async function mockExtractItemsFromImage(_dataUrl: string): Promise<ReceiptItem[]> {
  // Delay kecil agar terasa proses
  await new Promise((r) => setTimeout(r, 600))
  return [
    { id: crypto.randomUUID(), name: "Gula 1kg", qty: 2, price: 14000 },
    { id: crypto.randomUUID(), name: "Minyak Goreng 1L", qty: 1, price: 18000 },
    { id: crypto.randomUUID(), name: "Detergen 800g", qty: 3, price: 12000 },
  ]
}
