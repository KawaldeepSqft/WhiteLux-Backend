import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();




// ---- Config from env ----
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const SHEET_NAME = 'Sheet2';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

router.post("/", async (req, res) => {
  try {
    const { fullName, phone, referral, comments } = req.body || {};
    if (!fullName || !phone) {
      return res.status(400).json({ message: "Full Name and Phone are required!" });
    }
    
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          String(fullName).trim(),
          String(phone).trim(),
          referral ?? "",
          comments ?? "",
          submittedAt
        ]],
      },
    });

    res.status(200).json({ message: "✅ Request saved successfully!" });

  } catch (error) {
    // 🔍 Detailed error check
    let status = 500;
    let message = "❌ Failed to save data";

    if (error?.code === 403 || error?.message?.includes("PERMISSION_DENIED")) {
      status = 403;
      message = "❌ Permission denied. Did you share the sheet with the service account email?";
    } else if (error?.code === 404 || error?.message?.includes("notFound")) {
      status = 404;
      message = "❌ Spreadsheet or sheet name not found. Check GOOGLE_SPREADSHEET_ID / GOOGLE_SHEET_NAME.";
    } else if (error?.code === 400 || error?.message?.includes("invalid_grant")) {
      status = 400;
      message = "❌ Invalid service account or key. Try regenerating a new key.";
    }

    const detail =
      error?.errors?.[0]?.message ||
      error?.response?.data?.error?.message ||
      error?.message ||
      String(error);

    console.error("❌ /api/reqcall save failed:", detail);

    res.status(status).json({ message, detail });
  }
});

export default router;
