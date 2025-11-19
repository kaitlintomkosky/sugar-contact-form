// api/lead-capture.js
// Vercel serverless function that receives form data from the browser
// and forwards it server-to-server to SugarCRM WebToContactCapture.

import multer from "multer";

export const config = {
  api: {
    bodyParser: false, // we will use multer to parse multipart/form-data
  },
};

const upload = multer(); // multer().none() will parse form fields

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Optional: simple secret check (set RELAY_SECRET in Vercel env if you use it)
  const RELAY_SECRET = process.env.RELAY_SECRET;
  if (RELAY_SECRET) {
    const provided = req.headers["x-relay-secret"] || "";
    if (provided !== RELAY_SECRET) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
  }

  // Parse multipart/form-data
  upload.none()(req, res, async (parseErr) => {
    if (parseErr) {
      console.error("Form parse error:", parseErr);
      return res.status(400).json({ success: false, error: "Form parse error" });
    }

    try {
      // Build Web FormData (native in Node 18+)
      const fd = new FormData();
      for (const [k, v] of Object.entries(req.body || {})) {
        // multer returns string values for fields
        fd.append(k, v ?? "");
      }

      // Ensure required mapping if client forgot it
      if (!fd.get("req_id")) fd.append("req_id", "first_name;last_name;phone_home;email1;");

      // Forward request to Sugar (server-to-server)
      const sugarResp = await fetch(
        "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json",
        {
          method: "POST",
          body: fd
        }
      );

      // If sugar responds non-OK, log text for debugging (do not expose raw to public)
      const sugarText = await sugarResp.text();
      if (!sugarResp.ok) {
        console.error("Sugar HTTP error", sugarResp.status, sugarText);
      } else {
        console.log("Sugar forwarded OK");
      }

      // Return success boolean to browser
      return res.status(200).json({ success: sugarResp.ok });
    } catch (err) {
      console.error("Relay error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}
