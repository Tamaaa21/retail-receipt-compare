"use client"

import { AppHeader } from "@/components/app-header"
import { useSuppliers } from "@/lib/local-db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function SuppliersPage() {
  const { suppliers, addSupplier, removeSupplier, renameSupplier } = useSuppliers()
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)

  function add() {
    if (!name.trim()) return
    addSupplier(name.trim())
    setName("")
  }

  function saveEdit() {
    if (!editing) return
    renameSupplier(editing.id, editing.name.trim())
    setEditing(null)
  }

  return (
    <main>
      <AppHeader />
      <section className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="space-y-3">
          <h1 className="text-xl font-semibold">Supplier</h1>
          <div className="flex gap-2">
            <Input placeholder="Nama supplier" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={add}>Tambah</Button>
          </div>
        </div>

        <div className="space-y-2">
          {suppliers.map((s) => (
            <div key={s.id} className="border rounded-md p-3 flex items-center justify-between bg-card">
              {editing?.id === s.id ? (
                <div className="flex-1 flex gap-2">
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <Button onClick={saveEdit}>Simpan</Button>
                  <Button variant="secondary" onClick={() => setEditing(null)}>
                    Batal
                  </Button>
                </div>
              ) : (
                <>
                  <div className="font-medium">{s.name}</div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setEditing({ id: s.id, name: s.name })}>
                      Ubah
                    </Button>
                    <Button variant="destructive" onClick={() => removeSupplier(s.id)}>
                      Hapus
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="text-sm text-muted-foreground">Belum ada supplier. Tambahkan di atas.</div>
          )}
        </div>
      </section>
    </main>
  )
}
