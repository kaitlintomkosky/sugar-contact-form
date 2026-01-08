export const config = {
api: {
bodyParser: true, // Accept JSON from frontend
},
};

export default async function handler(req, res) {
// --- CORS headers ---
res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") return res.status(200).end();
if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

// ===== SPAM PROTECTION =====
const BOT_FIELDS = [
  'company',
  'website',
  'url',
  'fax',
  'company_name'
];

for (const field of BOT_FIELDS) {
  if (req.body[field]) {
    //res.status(405).json({ success: false, error: "1" });
    return res.status(200).json({ success: true });
  }
}
  
const ua = req.headers['user-agent'];
const origin = req.headers['origin'];
const referer = req.headers['referer'];

if (!ua || !origin || !referer) {
  //res.status(405).json({ success: false, error: "2" });
  return res.status(200).json({ success: true });
}

if (!origin.includes('yourmoveinready.com')) {
  //res.status(405).json({ success: false, error: "3" });
  return res.status(200).json({ success: true });
}
//

try {
const payload = req.body;

// --- Required Sugar fields ---
const required = {
  req_id: "first_name;last_name;phone_home;email1;",
  campaign_id: "0d0947f0-d3d1-11ec-b0cd-06f2b4fb7f46",
  redirect_url: "https://www.yourmoveinready.com/",
  redirectRequestType: "GET",
  redirectIncludeParams: "0",
  email_opt_in: "on",
};

// --- Merge JSON with required fields ---
const merged = { ...required, ...payload };

// --- Create FormData for Sugar (browser-style multipart) ---
const formData = new FormData();
for (const key in merged) {
  if (merged[key] != null) formData.append(key, merged[key]);
}

// --- Send POST to Sugar ---
const sugarResp = await fetch(
  "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json",
  {
    method: "POST",
    body: formData, // Let fetch handle multipart boundary
  }
);

const text = await sugarResp.text();

// Sugar returns JS/HTML snippet, not JSON
return res.status(200).json({
  success: true,
  sugarStatus: sugarResp.status,
  response: text,
  debugBody: merged,
});

} catch (error) {
return res.status(500).json({ success: false, error: error.toString() });
}
}
