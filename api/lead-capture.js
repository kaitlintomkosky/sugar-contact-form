import multer from "multer";
import { NextResponse } from "next/server";

export const config = {
api: {
bodyParser: false, // We handle parsing with multer
},
};

const upload = multer();

export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({ success: false, error: "Method not allowed" });
}

try {
// Parse incoming form-data
await new Promise((resolve, reject) => {
upload.none()(req, {}, (err) => (err ? reject(err) : resolve()));
});

```
const formData = new FormData();

// Ensure required fields exist and append them
const requiredFields = ["first_name", "last_name", "email1"];
for (const field of requiredFields) {
  const value = req.body[field]?.trim() || "";
  formData.append(field, value);
  console.log("Appending:", field, value);
}

// Append all other fields dynamically
for (const [key, value] of Object.entries(req.body)) {
  if (!requiredFields.includes(key)) {
    formData.append(key, value ?? "");
    console.log("Appending:", key, value ?? "");
  }
}

// Sugar endpoint
const sugarEndpoint =
  "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json";

// Forward request to Sugar
const sugarResp = await fetch(sugarEndpoint, { method: "POST", body: formData });
const sugarData = await sugarResp.json();

console.log("Sugar response:", sugarData);

return res.status(200).json({
  success: true,
  sugarStatus: sugarResp.status,
  response: sugarData,
});
```

} catch (err) {
console.error(err);
return res.status(500).json({ success: false, error: err.message });
}
}
