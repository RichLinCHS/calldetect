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

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return response.status(503).json({ message: "Live number validation has not been configured." });
  }

  try {
    const auth = Buffer.from(TWILIO_ACCOUNT_SID + ":" + TWILIO_AUTH_TOKEN).toString("base64");
    const result = await fetch("https://lookups.twilio.com/v2/PhoneNumbers/" + encodeURIComponent(number), {
      headers: { Authorization: "Basic " + auth },
      signal: AbortSignal.timeout(8000)
    });
    if (!result.ok) throw new Error("Lookup provider returned an error.");
    const data = await result.json();
    return response.status(200).json({
      valid: data.valid === true,
      country: data.country_code ?? null,
      source: "https://www.twilio.com/docs/lookup/v2-api"
    });
  } catch {
    return response.status(502).json({ message: "The lookup provider is unavailable. Try again later." });
  }
}
