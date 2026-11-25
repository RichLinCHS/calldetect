export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ message: "Use POST." });
  }

  const number = request.body?.number;
  if (typeof number !== "string" || !/^\+[1-9]\d{6,14}$/.test(number)) {
    return response.status(400).json({ message: "Enter a number with a country code." });
  }

  const { TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET } = process.env;
  if (!TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    return response.status(503).json({ message: "Live number validation has not been configured." });
  }

  try {
    const auth = Buffer.from(TWILIO_API_KEY_SID + ":" + TWILIO_API_KEY_SECRET).toString("base64");
    const result = await fetch("https://lookups.twilio.com/v2/PhoneNumbers/" + encodeURIComponent(number), {
      headers: { Authorization: "Basic " + auth },
      signal: AbortSignal.timeout(8000)
    });
    if (!result.ok) throw new Error("Lookup provider returned an error.");
    const data = await result.json();
    const { summary, summaryStatus } = await summarize(data);
    return response.status(200).json({
      summary,
      summaryStatus,
      valid: data.valid === true,
      country: data.country_code ?? null,
      source: "https://www.twilio.com/docs/lookup/v2-api"
    });
  } catch {
    return response.status(502).json({ message: "The lookup provider is unavailable. Try again later." });
  }
}

async function summarize(data) {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return { summary: null, summaryStatus: "not_configured" };
  try {
    const result = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
        max_tokens: 512,
        temperature: 0.1,
        messages: [{
          role: "system",
          content: "Explain the supplied phone-number validation facts in two short sentences. The country code refers to the numbering assignment only. Never infer caller identity, location, or spam status."
        }, {
          role: "user",
          content: JSON.stringify({ valid: data.valid === true, country: data.country_code ?? null })
        }]
      })
    });
    if (!result.ok) {
      return { summary: null, summaryStatus: "provider_http_" + result.status };
    }
    const summary = (await result.json()).choices?.[0]?.message?.content;
    const text = typeof summary === "string" ? summary.trim().slice(0, 800) : "";
    return { summary: text || null, summaryStatus: text ? "ready" : "empty" };
  } catch {
    return { summary: null, summaryStatus: "unreachable" };
  }
}