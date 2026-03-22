import { NextRequest, NextResponse } from 'next/server';
import { upsertScanRow } from '@/lib/sheets';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sku = String(body.sku || '').trim();
    const location = String(body.location || '').trim();

    if (!sku || !location) {
      return NextResponse.json(
        { success: false, message: 'SKU and location are required.' },
        { status: 400 }
      );
    }

    const result = await upsertScanRow({ sku, location });

    return NextResponse.json({
      success: true,
      message:
        result.action === 'updated'
          ? `Updated ${sku} → ${location}`
          : `Created ${sku} → ${location}`,
      scan: result,
    });
  } catch (error) {
    console.error('Assign location error:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to write to Google Sheets.' },
      { status: 500 }
    );
  }
}