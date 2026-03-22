import { google } from 'googleapis';

type ScanResult = {
  action: 'created' | 'updated';
  date: string;
  sku: string;
  location: string;
  status: string;
};

function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME || 'Sheet1';

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error('Missing Google Sheets environment variables.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  return {
    sheets,
    spreadsheetId,
    sheetName,
  };
}

function getTodayDateString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  return `${month}/${day}/${year}`;
}

export async function upsertScanRow({
  sku,
  location,
}: {
  sku: string;
  location: string;
}): Promise<ScanResult> {
  const { sheets, spreadsheetId, sheetName } = getSheetsClient();
  const date = getTodayDateString();
  const status = 'ACTIVE';

  // Read existing rows
  const readResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:D`,
  });

  const rows = readResponse.data.values || [];

  // Row 1 is headers, so data starts at index 1
  let existingRowNumber: number | null = null;

  for (let i = 1; i < rows.length; i++) {
    const rowSku = (rows[i][1] || '').toString().trim();
    if (rowSku === sku) {
      existingRowNumber = i + 1; // sheet rows are 1-based
      break;
    }
  }

  if (existingRowNumber) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${existingRowNumber}:D${existingRowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[date, sku, location, status]],
      },
    });

    return {
      action: 'updated',
      date,
      sku,
      location,
      status,
    };
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:D`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[date, sku, location, status]],
    },
  });

  return {
    action: 'created',
    date,
    sku,
    location,
    status,
  };
}