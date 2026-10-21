import { NextRequest, NextResponse } from 'next/server';

/**
 * M-Pesa Callback Endpoint
 * 
 * This is called by Safaricom's Daraja API after an STK Push payment is completed.
 * In production, you would:
 * 1. Parse the callback data
 * 2. Find the registration matching the CheckoutRequestID
 * 3. Update the registration status to 'confirmed'
 * 4. Store the M-Pesa transaction code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[M-Pesa Callback] Received:', JSON.stringify(body, null, 2));

    // Safaricom callback structure:
    // body.Body.stkCallback.ResultCode === 0 means success
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback data' });
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callback;

    if (ResultCode === 0) {
      // Payment successful
      const metadata = CallbackMetadata?.Item || [];
      
      const mpesaReceiptNumber = metadata.find(
        (item: { Name: string; Value: string }) => item.Name === 'MpesaReceiptNumber'
      )?.Value;

      const amount = metadata.find(
        (item: { Name: string; Value: number }) => item.Name === 'Amount'
      )?.Value;

      const phoneNumber = metadata.find(
        (item: { Name: string; Value: number }) => item.Name === 'PhoneNumber'
      )?.Value;

      console.log('[M-Pesa Callback] Payment confirmed:', {
        CheckoutRequestID,
        mpesaReceiptNumber,
        amount,
        phoneNumber,
      });

      // TODO: In production, update the registration in the database:
      // await prisma.registration.updateMany({
      //   where: { 
      //     phone: String(phoneNumber).replace('254', '0'),
      //     status: { in: ['pending_payment', 'provisional'] }
      //   },
      //   data: {
      //     status: 'confirmed',
      //     mpesaCode: mpesaReceiptNumber,
      //     amountPaid: Number(amount),
      //   },
      // });
    } else {
      console.log('[M-Pesa Callback] Payment failed:', {
        CheckoutRequestID,
        ResultCode,
        ResultDesc,
      });
    }

    // Always respond with success to Safaricom
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback received successfully',
    });
  } catch (error) {
    console.error('[M-Pesa Callback] Error:', error);
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: 'Error processing callback',
    });
  }
}
