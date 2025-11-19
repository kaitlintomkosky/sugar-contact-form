// File: /api/lead-capture.js
import { FormData } from 'formdata-node';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://www.yourmoveinready.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Set CORS header for actual request
  res.setHeader('Access-Control-Allow-Origin', 'https://www.yourmoveinready.com');

  try {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => resolve(new URLSearchParams(data)));
      req.on('error', reject);
    });

    // Build FormData for Sugar
    const fd = new FormData();
    for (const [k, v] of body.entries()) {
      fd.append(k, v);
    }

    if (!fd.get('req_id')) {
      fd.append('req_id', 'first_name;last_name;phone_home;email1;');
    }

    // Send to Sugar server-to-server
    const sugarResponse = await fetch(
      'https://moveinready.sugarondemand.com/index.php?entryPoint=WebToContactCapture&json',
      { method: 'POST', body: fd }
    );

    return res.status(200).json({ success: sugarResponse.ok });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
