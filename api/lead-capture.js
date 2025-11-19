export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // --- Handle preflight ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const sugarCRMUrl = "YOUR_SUGAR_ENDPOINT_HERE";

    const response = await fetch(sugarCRMUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.text();

    res.status(200).json({ success: true, response: data });
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ success: false, error: error.toString() });
  }
}
