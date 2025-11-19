export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  try {
    const sugarUrl =
      "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json";

    // Forward the request directly (multipart/form-data)
    const sugarResp = await fetch(sugarUrl, {
      method: "POST",
      headers: req.headers, // keeps the original headers, including Content-Type
      body: req, // pipe the request body as-is
    });

    const text = await sugarResp.text();

    return res.status(200).json({
      success: true,
      sugarStatus: sugarResp.status,
      response: text,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.toString() });
  }
}
