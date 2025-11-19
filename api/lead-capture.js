import multer from "multer";

export const config = {
  api: {
    bodyParser: false, // important for multer
  },
};

const upload = multer();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    // multer parses the form and puts fields in req.body
    await new Promise((resolve, reject) => {
      upload.none()(req, {}, (err) => (err ? reject(err) : resolve()));
    });

    const required = {
      moduleDir: "Contacts",
      json: "1",
      //campaign_id: "0d0947f0-d3d1-11ec-b0cd-06f2b4fb7f46",
    };

    const merged = { ...required, ...req.body };

    const sugarBody = new URLSearchParams();
    for (const key in merged) sugarBody.append(key, merged[key]);

    const sugarUrl = "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json";

    const sugarResp = await fetch(sugarUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: sugarBody.toString(),
    });

    const text = await sugarResp.text();

    return res.status(200).json({
      success: true,
      sugarStatus: sugarResp.status,
      response: text,
      debugBody: merged, // optional for debugging
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ success: false, error: error.toString() });
  }
}
