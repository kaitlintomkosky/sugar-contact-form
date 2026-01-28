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

function looksLikeGibberish(str) {
  if (!str || typeof str !== 'string') return false;

  const trimmed = str.trim();

  // Allow common human name punctuation
  if (/^[A-Za-z '&.\-]+$/.test(trimmed)) {
    return false;
  }

  // Long strings with no spaces (but not names)
  if (trimmed.length > 30 && !trimmed.includes(' ')) return true;

  // Remove non-letters for vowel analysis
  const lettersOnly = trimmed.replace(/[^a-z]/gi, '');

  // Skip very short or name-like inputs
  if (lettersOnly.length < 8) return false;

  const vowels = (lettersOnly.match(/[aeiou]/gi) || []).length;
  if (vowels / lettersOnly.length < 0.2) return true;

  // Encoded / machine-like strings
  if (/^[A-Za-z0-9+/=]{20,}$/.test(trimmed)) return true;

  return false;
}


// ---------- 1. Gibberish checks (NO address fields) ----------
const GIBBERISH_FIELDS = [
  'first_name',
  'last_name',
  'assistant',
  'title',
  'comments_c'
];

for (const field of GIBBERISH_FIELDS) {
  if (looksLikeGibberish(req.body[field], field)) {
    console.log('blocked: gibberish', field);
    return res.status(200).json({ success: true });
  }
}

// ---------- 2. Similarity check (ONLY free-text fields) ----------
const SIMILARITY_FIELDS = [
  'comments_c',
  'assistant',
  'title'
];

const similarityValues = SIMILARITY_FIELDS
  .map(f => req.body[f])
  .filter(v => typeof v === 'string' && v.length > 10);

if (similarityValues.length >= 2) {
  const uniqueRatio = new Set(similarityValues).size / similarityValues.length;
  if (uniqueRatio < 0.5) {
    console.log('blocked: similarity');
    return res.status(200).json({ success: true });
  }
}

// ---------- 3. Email realism check (safe) ----------
const email = req.body.email1;
if (email) {
  const [local] = email.split('@');
  if (
    local.length > 25 &&
    /^[^aeiou]+$/i.test(local.replace(/\./g, ''))
  ) {
    console.log('blocked: email');
    return res.status(200).json({ success: true });
  }
}

// ---------- 4. Bot honeypot fields ----------
const BOT_FIELDS = [
  'company',
  'website',
  'url',
  'fax',
  'company_name'
];

for (const field of BOT_FIELDS) {
  if (req.body[field]) {
    console.log('blocked: bot field', field);
    return res.status(200).json({ success: true });
  }
}

// ---------- 5. Header / origin validation ----------
const ua = req.headers['user-agent'];
const origin = req.headers['origin'];
const referer = req.headers['referer'];

if (!ua || !origin || !referer) {
  console.log('blocked: missing headers');
  return res.status(200).json({ success: true });
}

if (!origin.includes('yourmoveinready.com')) {
  console.log('blocked: bad origin', origin);
  return res.status(200).json({ success: true });
}

// ===== END SPAM PROTECTION =====

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
