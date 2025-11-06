"use client"

import useSWR from "swr"

interface OcrStatus {
  connected: boolean
  message?: string
}

const fetcher = async (url: string): Promise<OcrStatus> => {
  try {
    const res = await fetch(url, { method: "GET" })
    if (res.ok) {
      return { connected: true, message: "Backend OCR terhubung" }
    }
    return { connected: false, message: "Backend OCR tidak merespons" }
  } catch {
    return { connected: false, message: "Backend OCR tidak tersedia" }
  }
}

export function useOcrStatus() {
  const { data, isLoading } = useSWR("/api/ocr/health", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    focusThrottleInterval: 30000,
  })

  return {
    connected: data?.connected ?? false,
    message: data?.message ?? "Memeriksa koneksi...",
    isLoading,
  }
}
