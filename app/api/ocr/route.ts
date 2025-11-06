export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const apiBase = process.env.OCR_API_URL
    if (!apiBase) {
      return new Response(JSON.stringify({ error: "OCR_API_URL is not set" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const formData = await req.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const forward = new FormData()
    forward.append("file", file)

    const resp = await fetch(`${apiBase.replace(/\/$/, "")}/api/ocr`, {
      method: "POST",
      body: forward,
    })

    const jsonData = await resp.json()
    console.log("[v0] OCR backend response:", jsonData)

    return new Response(JSON.stringify(jsonData), {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("[v0] OCR error:", err)
    return new Response(JSON.stringify({ error: err?.message || "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

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
      return new Response(JSON.stringify({ status: "ok", message: "OCR backend connected" }), {
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
