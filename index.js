import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { google } from "googleapis";
import ReqCallRoute from "./routes/ReqCall.js";
import dotenv from "dotenv";
dotenv.config();




const app = express();
app.use(cors()); // Allow frontend
app.use(bodyParser.json());



// Google Auth
// const auth = new google.auth.GoogleAuth({
//   keyFile: "service-account.json", // your service account file
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Your Google Sheet ID (copy from sheet URL)
// const spreadsheetId = ""; // replace with your own

// Function to append data to Google Sheet
async function appendToSheet(data) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,   // ✅ correct key
    range: "Sheet1!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {                                      // ✅ correct field
      values: [[
        data.name || "",
        data.email || "",
        data.phone || "",
        data.projectName || "",
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      ]],
    },
  });
}

// API endpoint
app.post("/submit", async (req, res) => {
  try {
    
    await appendToSheet(req.body);
    res.status(200).json({ message: "Your Form is Submit SuccessFully" });
  } catch (err) {
    // 🔍 Deep debug logs
    const gerr =
      err?.errors?.[0]?.message ||
      err?.response?.data?.error?.message ||
      err?.message ||
      err;

    console.error("Sheet write error (raw):", err);
    console.error("Sheet write error (msg):", gerr);

    res.status(500).json({ error: "Failed to save data", detail: gerr });
  }
});

app.use("/api/reqcall", ReqCallRoute);
app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
