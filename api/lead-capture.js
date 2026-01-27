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

  // ===== ADVANCED SPAM HEURISTICS =====
function looksLikeGibberish(str) {
  if (!str || typeof str !== 'string') return false;
  if (str.length > 25 && !str.includes(' ')) return true;

  const vowels = (str.match(/[aeiou]/gi) || []).length;
  if (str.length > 10 && vowels / str.length < 0.25) return true;

  if (/^[A-Za-z0-9+/=]{15,}$/.test(str)) return true;
  return false;
}

const GIBBERISH_FIELDS = [
  'first_name',
  'last_name',
  'assistant',
  'title',
  'comments_c',
  'primary_address_street',
  'primary_address_city'
];

for (const field of GIBBERISH_FIELDS) {
  if (looksLikeGibberish(req.body[field])) {
    console.log(field);
    console.log('gibberish');
    //return res.status(200).json({ success: true });
  }
}

const values = Object.values(req.body)
  .filter(v => typeof v === 'string' && v.length > 5);

if (values.length) {
  const uniqueRatio = new Set(values).size / values.length;
  if (uniqueRatio < 0.5) {
    console.log('ratio');
    //return res.status(200).json({ success: true });
  }
}

const email = req.body.email1;
if (email) {
  const [local] = email.split('@');
  if (local.length > 20 && !/[a-z]/i.test(local.replace(/\./g, ''))) {
    console.log('email');
    //return res.status(200).json({ success: true });
  }
}
  
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
