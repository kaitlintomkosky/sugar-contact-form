Sugar Relay for SugarCRM WebToContactCapture
===========================================

Deploy this repo to Vercel (import Git repo to Vercel). It exposes:
  POST /api/lead-capture

Set environment variable (optional):
  RELAY_SECRET=some-secret-value

Client (Squarespace) must POST form-data to:
  https://<your-vercel-app>.vercel.app/api/lead-capture
