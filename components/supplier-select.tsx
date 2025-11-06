"use client"

import { useSuppliers } from "@/lib/local-db"

type Props = {
  value?: string
  onChange: (supplierId?: string) => void
  placeholder?: string
  allowNone?: boolean
}

export function SupplierSelect({ value, onChange, placeholder = "Pilih supplier", allowNone = true }: Props) {
  const { suppliers } = useSuppliers()
  return (
    <select
      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      {allowNone && <option value="">{placeholder}</option>}
      {suppliers.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  )
}
