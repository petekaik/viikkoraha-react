const config = {
  // ⚠️ NEVER commit real values here — set these in .env and build-time inject,
  // or load from a backend endpoint. These are placeholder/demo values.
  CLIENT_ID:
    "YOUR_CLIENT_ID.apps.googleusercontent.com",
  API_KEY: "YOUR_API_KEY",
  DISCOVERY_DOCS: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
  SCOPES: "https://www.googleapis.com/auth/spreadsheets",
  SPREADSHEET_ID: "YOUR_SPREADSHEET_ID",
  CHORES_RANGE: "Chores!A2:D",
  BOOKINGS_RANGE: "Bookings!A2:G",
  SUMS_RANGE: "Sums!A2:B"
};
