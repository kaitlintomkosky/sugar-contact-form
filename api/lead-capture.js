export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.yourmoveinready.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Convert JSON body → form-encoded
    const formBody = new URLSearchParams(req.body).toString();

    const sugarUrl =
      "https://moveinready.sugarondemand.com/index.php?entryPoint=WebToLeadCapture&json";

    const sugarResponse = await fetch(sugarUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });

    const text = await sugarResponse.text();

    return res.status(200).json({
      success: true,
      sugarStatus: sugarResponse.status,
      response: text,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.toString(),
    });
  }
}
