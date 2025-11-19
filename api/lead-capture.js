export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // REQUIRED by Sugar in almost all WebToLead setups
    const required = {
      moduleDir: "Contacts",
      json: "1",
      campaign_id: "0d0947f0-d3d1-11ec-b0cd-06f2b4fb7f46"
    };

    // Merge Squarespace form fields with mandatory Sugar fields
    const merged = { ...required, ...req.body };

    const formBody = new URLSearchParams(merged).toString();

    const sugarUrl =
      "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToLeadCapture";

    const response = await fetch(sugarUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });

    const text = await response.text();

    return res.status(200).json({
      success: true,
      sugarStatus: response.status,
      response: text,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.toString(),
    });
  }
}
