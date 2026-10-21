import { NextRequest, NextResponse } from 'next/server';

// M-Pesa Daraja API Configuration
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || '';
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/mpesa/callback';

const BASE_URL =
  MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

/**
 * Get OAuth access token from Daraja API
 */
async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');

  const response = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to get M-Pesa access token');
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Format phone number to 254XXXXXXXXX format
 */
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }

  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, amount, eventId, accountRef } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // Check if real credentials are configured
    if (
      CONSUMER_KEY === 'YOUR_CONSUMER_KEY_HERE' ||
      CONSUMER_SECRET === 'YOUR_CONSUMER_SECRET_HERE' ||
      PASSKEY === 'YOUR_PASSKEY_HERE'
    ) {
      // Return simulated success for development
      console.log('[M-Pesa STK Push] Simulated request:', {
        phone: formatPhoneNumber(phone),
        amount,
        eventId,
        accountRef,
      });

      return NextResponse.json({
        success: true,
        message:
          'STK Push simulated successfully (development mode). ' +
          'Configure real Daraja API credentials in .env for production.',
        simulated: true,
        CheckoutRequestID: `sim_${Date.now()}`,
        MerchantRequestID: `sim_mrq_${Date.now()}`,
        ResponseDescription: 'Success. Request accepted for processing (simulated)',
      });
    }

    // Real Daraja API integration
    const accessToken = await getAccessToken();
    const formattedPhone = formatPhoneNumber(phone);
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .substring(0, 14);
    const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

    const stkPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(Number(amount)),
      PartyA: formattedPhone,
      PartyB: SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountRef || 'MCKBeyond',
      TransactionDesc: `MCK Beyond Event Registration - ${eventId || 'general'}`,
    };

    const stkResponse = await fetch(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stkPayload),
      }
    );

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode === '0') {
      return NextResponse.json({
        success: true,
        message: 'STK Push sent to your phone. Enter your M-Pesa PIN to complete.',
        CheckoutRequestID: stkData.CheckoutRequestID,
        MerchantRequestID: stkData.MerchantRequestID,
        ResponseDescription: stkData.ResponseDescription,
      });
    } else {
      return NextResponse.json(
        {
          error: stkData.errorMessage || stkData.ResponseDescription || 'STK Push failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    return NextResponse.json(
      { error: 'Failed to process M-Pesa payment request. Please try again.' },
      { status: 500 }
    );
  }
}
