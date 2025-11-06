"use client"

import { AppHeader } from "@/components/app-header"
import { useReceipts, useSuppliers } from "@/lib/local-db"

type ItemRow = {
  name: string
  // supplierId -> harga rata-rata atau terbaru; di sini kita ambil harga minimum yang ditemukan
  prices: Record<string, number> // supplierId -> min price
}

export default function ComparePage() {
  const { receipts } = useReceipts()
  const { suppliers } = useSuppliers()

  // Kumpulkan data: map nama item -> supplier -> harga minimum
  const rowsMap = new Map<string, ItemRow>()
  for (const r of receipts) {
    for (const it of r.items) {
      const key = it.name.trim()
      if (!key) continue
      const row = rowsMap.get(key) ?? { name: key, prices: {} }
      if (it.supplierId) {
        const current = row.prices[it.supplierId]
        row.prices[it.supplierId] = current == null ? it.price : Math.min(current, it.price)
      }
      rowsMap.set(key, row)
    }
  }
  const rows = Array.from(rowsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  function supplierName(id: string) {
    return suppliers.find((s) => s.id === id)?.name ?? "?"
  }

  return (
    <main>
      <AppHeader />
      <section className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <h1 className="text-xl font-semibold">Perbandingan Harga</h1>
        <p className="text-sm text-muted-foreground">
          Tabel di bawah menampilkan harga per item dari masing-masing supplier (mengambil harga minimum yang ditemukan
          pada nota). Harga termurah di setiap baris akan disorot.
        </p>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Item</th>
                {suppliers.map((s) => (
                  <th key={s.id} className="py-2 pr-4">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const values = Object.values(row.prices)
                const min = values.length ? Math.min(...values) : null
                return (
                  <tr key={row.name} className="border-b">
                    <td className="py-2 pr-4 font-medium">{row.name}</td>
                    {suppliers.map((s) => {
                      const price = row.prices[s.id]
                      const isMin = min != null && price === min
                      return (
                        <td key={s.id} className="py-2 pr-4">
                          {price != null ? (
                            <span className={isMin ? "px-2 py-1 rounded bg-primary text-primary-foreground" : ""}>
                              Rp {price.toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={1 + suppliers.length}>
                    Belum ada data untuk dibandingkan. Upload nota dan tetapkan supplier di setiap item.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
