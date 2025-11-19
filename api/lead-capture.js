import { URLSearchParams } from "url";

export const config = {
api: {
bodyParser: true, // Let Next.js parse JSON or URL-encoded automatically
},
};

export default async function handler(req, res) {
// --- CORS headers ---
res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
return res.status(200).end();
}

if (req.method !== "POST") {
return res.status(405).json({ success: false, error: "Method not allowed", errors: [] });
}

try {
// --- Required Sugar fields ---
const required = {
moduleDir: "Contacts",
json: "1",
campaign_id: "0d0947f0-d3d1-11ec-b0cd-06f2b4fb7f46",
};

// Merge front-end form with required Sugar fields
const merged = { ...required, ...req.body };

// Convert to URLSearchParams for x-www-form-urlencoded POST
const formBody = new URLSearchParams();
for (const key in merged) {
  if (merged[key] != null) formBody.append(key, merged[key]);
}

// --- Sugar endpoint ---
const sugarUrl = "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json";

const sugarResp = await fetch(sugarUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: formBody.toString(),
});

const text = await sugarResp.text();

let sugarJson = null;
try {
  sugarJson = JSON.parse(text);
} catch (e) {
  // Sugar returned non-JSON response (e.g., maintenance page)
  sugarJson = null;
}

if (sugarJson && sugarJson.success === false && Array.isArray(sugarJson.errors)) {
  return res.status(200).json({
    success: false,
    errors: sugarJson.errors,
    response: text,
  });
}

return res.status(200).json({
  success: true,
  sugarStatus: sugarResp.status,
  response: text,
});

} catch (error) {
console.error("Server error:", error);
return res.status(500).json({
success: false,
errors: [],
error: error.toString(),
});
}
}
