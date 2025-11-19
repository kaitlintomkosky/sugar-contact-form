export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  try {
    // --- Read body into a buffer ---
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bodyBuffer = Buffer.concat(chunks);

    const sugarUrl =
      "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json";

    const sugarResp = await fetch(sugarUrl, {
      method: "POST",
      headers: {
        ...req.headers,
        host: "moveinready.sugarondemand.com", // sometimes required
      },
      body: bodyBuffer,
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
};
