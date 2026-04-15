/**
 * POST /api/payments/netopia/ipn
 *
 * Instant Payment Notification webhook from Netopia (MobilPay).
 * Netopia posts form data (env_key + data + iv + cipher) encrypted with
 * AES-256-CBC (key encrypted via RSA-PKCS1-V1_5 with our private key).
 *
 * CRITICAL:
 *  - Must respond with a specific XML format (Netopia retries if not received)
 *  - Must be idempotent (Netopia can POST the same IPN multiple times)
 *  - Must validate the decrypted payload before trusting its content
 *  - Must use service-role Supabase client (no user session available)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPaymentByOrderId,
  confirmPayment,
  failPayment,
  activateSubscription,
  getAdminSupabase,
} from '@/lib/billing';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import { decryptNetopiaIpn } from '@/lib/netopia';
import type { BillingCycle, NetopiaIpnData } from '@/types/billing';

// ─── XML Response Helpers ─────────────────────────────────────────────────────

function xmlOk(): NextResponse {
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<crc error_type="0" error_code="0">Success</crc>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

function xmlError(code: number, message: string): NextResponse {
  const safe = message.replace(/[<>&"']/g, '');
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<crc error_type="1" error_code="${code}">${safe}</crc>`;
  return new NextResponse(xml, {
    status: 200, // Always 200 — Netopia treats non-200 as a retry signal
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

// ─── XML Parsing Helpers ──────────────────────────────────────────────────────

function extractXmlValue(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function extractXmlAttr(xml: string, tag: string, attr: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, 'i'));
  return match?.[1]?.trim() ?? '';
}

/**
 * Parse the Netopia IPN XML into a structured object.
 *
 * Netopia XML structure (simplified):
 * <order id="PAY_..." timestamp="...">
 *   <mobilpay timestamp="..." crc="...">
 *     <action>...</action>
 *     <customer type="card">...</customer>
 *     <purchase>
 *       <invoice currency="RON" amount="80.00">...</invoice>
 *       <payment>
 *         <amount>80.00</amount>
 *         <action>...</action>
 *       </payment>
 *     </purchase>
 *     <error type="0">
 *       <code>0</code>
 *       <message>Approved</message>
 *     </error>
 *   </mobilpay>
 * </order>
 */
function parseIpnXml(xml: string): NetopiaIpnData {
  const orderId = extractXmlAttr(xml, 'order', 'id');
  const timestamp = extractXmlAttr(xml, 'order', 'timestamp');
  const action = extractXmlValue(xml, 'action');
  const errorCode = parseInt(extractXmlValue(xml, 'code') || '0', 10);
  const errorMessage = extractXmlValue(xml, 'message');
  const amount = parseFloat(extractXmlValue(xml, 'amount') || '0');
  const currency = extractXmlAttr(xml, 'invoice', 'currency') || 'RON';

  // Map Netopia action strings to our status enum
  const statusMap: Record<string, NetopiaIpnData['status']> = {
    confirmed: 'confirmed',
    paid_pending: 'pending',
    canceled: 'canceled',
    credit: 'credit',
    confirmed_pending: 'pending',
  };

  const status = statusMap[action] ?? action;

  return { orderId, status, amount, currency, errorCode, errorMessage, timestamp };
}

// ─── IPN Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let rawXml = '';

  try {
    // ── 1. Read form data ───────────────────────────────────────────────────
    const formData = await req.formData();

    // Log every field Netopia sent so we can debug missing/unexpected fields
    const allFields: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      allFields[k] = typeof v === 'string' ? v.slice(0, 80) : '[file]';
    }
    console.info('[IPN] Received fields:', JSON.stringify(allFields));

    const env_key = formData.get('env_key') as string | null;
    const data    = formData.get('data')    as string | null;
    const iv      = formData.get('iv')      as string | null;
    const cipher  = formData.get('cipher')  as string | null;

    if (!env_key || !data) {
      console.error('[IPN] Missing env_key or data in request');
      return xmlError(1, 'Missing env_key or data');
    }

    // ── 2. Decrypt payload ──────────────────────────────────────────────────
    const privateKey = process.env.NETOPIA_PRIVATE_KEY;
    if (!privateKey) {
      // Sandbox/dev fallback — accept mock payloads for local testing
      console.warn('[IPN] NETOPIA_PRIVATE_KEY not set — using mock mode');
      rawXml = Buffer.from(data, 'base64').toString('utf8');
    } else {
      rawXml = decryptNetopiaIpn(
        env_key,
        data,
        iv ?? '',
        cipher ?? 'aes-256-cbc',
      );
    }

    console.info('[IPN] Decrypted XML:', rawXml);

    // ── 3. Parse XML ────────────────────────────────────────────────────────
    const ipn = parseIpnXml(rawXml);

    if (!ipn.orderId) {
      console.error('[IPN] Could not extract orderId from XML');
      return xmlError(2, 'Could not parse orderId');
    }

    // ── 4. Look up payment record ───────────────────────────────────────────
    const paymentRecord = await getPaymentByOrderId(ipn.orderId);

    if (!paymentRecord) {
      // Unknown order — log and return OK (so Netopia doesn't keep retrying)
      console.error(`[IPN] No payment found for orderId: ${ipn.orderId}`);
      return xmlOk();
    }

    // ── 5. Store raw IPN for audit trail ────────────────────────────────────
    const providerResponse: Record<string, unknown> = {
      orderId: ipn.orderId,
      status: ipn.status,
      amount: ipn.amount,
      currency: ipn.currency,
      errorCode: ipn.errorCode,
      errorMessage: ipn.errorMessage,
      timestamp: ipn.timestamp,
      raw_xml: rawXml,
    };

    // ── 6. Handle payment outcome ────────────────────────────────────────────
    if (ipn.status === 'confirmed' || ipn.status === 'paid') {
      // ── 6a. Idempotency — skip if already paid ──────────────────────────
      const { alreadyPaid } = await confirmPayment(
        paymentRecord.id,
        ipn.orderId,
        providerResponse,
      );

      if (alreadyPaid) {
        console.info(`[IPN] Payment ${paymentRecord.id} already confirmed — ignoring duplicate`);
        return xmlOk();
      }

      // ── 6b. Activate subscription ────────────────────────────────────────
      await activateSubscription(
        paymentRecord.subscription_id,
        paymentRecord.billing_cycle as BillingCycle,
      );

      console.info(
        `[IPN] Activated subscription ${paymentRecord.subscription_id} for order ${ipn.orderId}`,
      );

      // ── 6c. Send confirmation email (best-effort, non-blocking) ─────────
      try {
        const db = getAdminSupabase();

        const { data: subData } = await db
          .from('billing_subscriptions')
          .select('user_id, billing_cycle, current_period_end, plans(name)')
          .eq('id', paymentRecord.subscription_id)
          .single();

        if (subData) {
          const { data: userRecord } = await db.auth.admin.getUserById(subData.user_id);
          const email = userRecord?.user?.email;

          if (email) {
            await sendPaymentConfirmationEmail({
              to: email,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              planName: (subData.plans as any)?.name ?? 'Pro',
              amount: ipn.amount,
              currency: ipn.currency,
              billingCycle: subData.billing_cycle as BillingCycle,
              periodEnd: subData.current_period_end,
            });
          }
        }
      } catch (emailErr) {
        // Non-fatal — log but don't fail the IPN response
        console.error('[IPN] Failed to send confirmation email:', emailErr);
      }
    } else if (ipn.status === 'canceled' || ipn.errorCode !== 0) {
      // ── 6d. Payment failed / canceled ────────────────────────────────────
      await failPayment(paymentRecord.id, ipn.orderId, providerResponse);
      console.info(`[IPN] Payment ${paymentRecord.id} marked as failed (status: ${ipn.status})`);
    } else {
      // pending / credit / other — log and acknowledge without state change
      console.info(`[IPN] Ignoring status "${ipn.status}" for order ${ipn.orderId}`);
    }

    return xmlOk();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[IPN] Unhandled error:', err);
    // Return error XML but still 200 — prevents infinite Netopia retries
    return xmlError(99, message);
  }
}

