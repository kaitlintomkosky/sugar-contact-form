export const config = {
api: {
bodyParser: true, // Let Next.js parse JSON or urlencoded
},
};

export default async function handler(req, res) {
// --- CORS headers ---
res.setHeader("Access-Control-Allow-Origin", "[https://www.yourmoveinready.com](https://www.yourmoveinready.com)");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

// Handle preflight requests
if (req.method === "OPTIONS") {
return res.status(200).end();
}

if (req.method !== "POST") {
return res.status(405).json({ success: false, error: "Method not allowed" });
}

try {
// --- Required Sugar fields ---
const requiredFields = {
moduleDir: "Contacts",
json: "1",
campaign_id: "0d0947f0-d3d1-11ec-b0cd-06f2b4fb7f46",
};

```
// Merge front-end form data with required fields
const merged = { ...requiredFields, ...req.body };

// Convert to URLSearchParams for x-www-form-urlencoded POST
const formBody = new URLSearchParams();
for (const key in merged) {
  if (merged[key] != null) formBody.append(key, merged[key]);
}

// --- Sugar endpoint ---
const sugarUrl =
  "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json";

const sugarResp = await fetch(sugarUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: formBody.toString(),
});

const sugarText = await sugarResp.text();

// Return Sugar’s response to the front-end
return res.status(200).json({
  success: true,
  sugarStatus: sugarResp.status,
  response: sugarText,
});
```

} catch (error) {
console.error("Server error:", error);
return res.status(500).json({
success: false,
error: error.toString(),
});
}
}
