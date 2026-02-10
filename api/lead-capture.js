export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // --- CORS headers ---
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  // ===== HELPERS =====
  function blockWithFields(fields = []) {
    console.log('blockWithFields');
    console.log(fields);
    return res.status(200).json({
      success: false,
      errors: fields,
    });
  }

  function looksLikeGibberish(str) {
    if (!str || typeof str !== "string") return false;

    const trimmed = str.trim();

    // Allow human names with normal punctuation
    if (/^[A-Za-z '&.\-]+$/.test(trimmed)) return false;

    // Long strings with no spaces
    if (trimmed.length > 30 && !trimmed.includes(" ")) return true;

    const lettersOnly = trimmed.replace(/[^a-z]/gi, "");
    if (lettersOnly.length < 8) return false;

    const vowels = (lettersOnly.match(/[aeiou]/gi) || []).length;
    if (vowels / lettersOnly.length < 0.2) return true;

    // Encoded / machine-like
    if (/^[A-Za-z0-9+/=]{20,}$/.test(trimmed)) return true;

    return false;
  }

  // ===== SPAM PROTECTION =====

  // 1. Gibberish detection (human-visible)
  const GIBBERISH_FIELDS = [
    "first_name",
    "last_name",
    "assistant",
    "title",
    "comments_c",
  ];

  for (const field of GIBBERISH_FIELDS) {
    if (looksLikeGibberish(req.body[field])) {
      console.log("blocked: gibberish", field);
      //return blockWithFields([field]);
      return res.status(500).json({
      success: false,
      error: [field],
    });
      return res.status(200).json({
      success: false,
      errors: [field],
    });
      console.log('after return');
    }
  }

  // 2. Email realism (human-visible)
  const email = req.body.email1;
  if (email) {
    const [local] = email.split("@");
    if (
      local.length > 25 &&
      /^[^aeiou]+$/i.test(local.replace(/\./g, ""))
    ) {
      console.log("blocked: email", email);
      return blockWithFields(["email1"]);
    }
  }

  // 3. Honeypot bot fields (highlight if filled)
  const BOT_FIELDS = [
    "company",
    "website",
    "url",
    "fax",
    "company_name",
  ];

  for (const field of BOT_FIELDS) {
    if (req.body[field]) {
      console.log("blocked: bot field", field);
      return blockWithFields([field]);
    }
  }

  // 4. Header / origin checks (silent)
  const ua = req.headers["user-agent"];
  const origin = req.headers["origin"];
  const referer = req.headers["referer"];

  if (!ua || !origin || !referer) {
    console.log("blocked: missing headers");
    return blockWithFields([]);
  }

  if (!origin.includes("yourmoveinready.com")) {
    console.log("blocked: bad origin", origin);
    return blockWithFields([]);
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

    const merged = { ...required, ...payload };

    const formData = new FormData();
    for (const key in merged) {
      if (merged[key] != null) formData.append(key, merged[key]);
    }

    const sugarResp = await fetch(
      "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json",
      {
        method: "POST",
        body: formData,
      }
    );

    const text = await sugarResp.text();

    return res.status(200).json({
      success: true,
      sugarStatus: sugarResp.status,
      response: text,
      debugBody: merged,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.toString(),
    });
  }
}
