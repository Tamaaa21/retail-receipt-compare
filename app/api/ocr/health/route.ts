export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const apiBase = process.env.OCR_API_URL
    if (!apiBase) {
      return new Response(JSON.stringify({ status: "error", message: "OCR_API_URL not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    }

    const resp = await fetch(`${apiBase.replace(/\/$/, "")}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    })

    if (resp.ok) {
      const data = await resp.json()
      return new Response(JSON.stringify({ status: "ok", message: "OCR backend connected", data }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ status: "error", message: "OCR backend not responding" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ status: "error", message: err?.message || "Health check failed" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
}