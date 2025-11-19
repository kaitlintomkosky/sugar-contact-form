import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // we'll parse manually
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  console.log("req.method:", req.method);
console.log("req.headers:", req.headers);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
  console.log("Parsed fields:", fields);

      // REQUIRED fields for Sugar
      const required = {
        moduleDir: "Contacts",
        json: "1",
        campaign_id: "0d0947f0-d3d1-11ec-b0cd-06f2b4fb7f46",
      };

      const merged = { ...required, ...fields };

      // Convert to x-www-form-urlencoded
      const body = new URLSearchParams(merged).toString();

      const sugarUrl =
        "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json";

      const sugarRes = await fetch(sugarUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const text = await sugarRes.text();

      return res.status(200).json({
        success: true,
        sugarStatus: sugarRes.status,
        response: text,
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.toString() });
  }
}
