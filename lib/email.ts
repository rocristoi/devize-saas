/**
 * lib/email.ts
 * Sends transactional emails via SMTP (Nodemailer).
 * Configured with SMTP_* environment variables — works with
 * any standard SMTP provider (Gmail, SendGrid, Brevo, etc.).
 *
 * All email functions are server-only and must never be
 * imported into client components.
 */

import 'server-only';
import nodemailer from 'nodemailer';

// ─── SMTP Transport ───────────────────────────────────────────────────────────

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true'; // true for port 465

  if (!host || !user || !pass) {
    throw new Error(
      '[email] Missing SMTP configuration. Set SMTP_HOST, SMTP_USER, SMTP_PASS.',
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
  });
}

const FROM_NAME = process.env.SMTP_FROM_NAME ?? 'Devize Auto Koders';
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER ?? '';

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildInvoiceIssuedHtml(params: {
  invoiceNumber: string;
  amount: number;
  currency: string;
  pdfUrl: string;
  recipientEmail: string;
}): string {
  const { invoiceNumber, amount, currency, pdfUrl } = params;
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Factură ${invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f9fafb; color: #111827; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .header { background: #2563eb; color: #fff; padding: 32px 40px; }
    .header h1 { margin: 0; font-size: 22px; }
    .body { padding: 32px 40px; }
    .body p { line-height: 1.6; }
    .amount { font-size: 28px; font-weight: 700; color: #2563eb; margin: 16px 0; }
    .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { padding: 20px 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Devize Auto Koders</h1>
    </div>
    <div class="body">
      <p>Bună ziua,</p>
      <p>Factura dumneavoastră a fost emisă:</p>
      <p><strong>Număr factură:</strong> ${invoiceNumber}</p>
      <div class="amount">${amount.toFixed(2)} ${currency}</div>
      <p>Puteți descărca factura accesând butonul de mai jos:</p>
      <a href="${pdfUrl}" class="btn">📄 Descarcă Factura</a>
      <p style="margin-top:32px;">Dacă aveți întrebări, ne puteți contacta la <a href="mailto:${FROM_EMAIL}">${FROM_EMAIL}</a>.</p>
    </div>
    <div class="footer">
      <p>Devize Auto Koders · Acest email a fost generat automat.</p>
    </div>
  </div>
</body>
</html>`;
}

function buildInvoiceIssuedText(params: {
  invoiceNumber: string;
  amount: number;
  currency: string;
  pdfUrl: string;
}): string {
  const { invoiceNumber, amount, currency, pdfUrl } = params;
  return [
    `Bună ziua,`,
    ``,
    `Factura dumneavoastră a fost emisă.`,
    `Număr factură: ${invoiceNumber}`,
    `Sumă: ${amount.toFixed(2)} ${currency}`,
    ``,
    `Descărcați factura: ${pdfUrl}`,
    ``,
    `Devize Auto Koders`,
  ].join('\n');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface SendInvoiceEmailParams {
  to: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  pdfUrl: string;
}

/**
 * Sends an invoice-issued notification to the customer.
 * Call this when an invoice transitions to `issued` status.
 */
export async function sendInvoiceIssuedEmail(params: SendInvoiceEmailParams): Promise<void> {
  const { to, invoiceNumber, amount, currency, pdfUrl } = params;

  const transport = createTransport();

  await transport.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `Factura ta ${invoiceNumber} de la Devize Auto Koders`,
    text: buildInvoiceIssuedText({ invoiceNumber, amount, currency, pdfUrl }),
    html: buildInvoiceIssuedHtml({
      invoiceNumber,
      amount,
      currency,
      pdfUrl,
      recipientEmail: to,
    }),
  });
}

export interface SendPaymentConfirmationEmailParams {
  to: string;
  planName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  periodEnd: string; // ISO date string
}

/**
 * Sends a payment confirmation email when a subscription is activated.
 */
export async function sendPaymentConfirmationEmail(
  params: SendPaymentConfirmationEmailParams,
): Promise<void> {
  const { to, planName, amount, currency, billingCycle, periodEnd } = params;
  const cycleLabel = billingCycle === 'yearly' ? 'anual' : 'lunar';
  const periodEndFormatted = new Date(periodEnd).toLocaleDateString('ro-RO');

  const transport = createTransport();

  await transport.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject: `Plată confirmată — Abonament ${planName}`,
    text: [
      `Mulțumim pentru plată!`,
      ``,
      `Plan: ${planName} (${cycleLabel})`,
      `Sumă: ${amount.toFixed(2)} ${currency}`,
      `Valabil până la: ${periodEndFormatted}`,
      ``,
      `Devize Auto Koders`,
    ].join('\n'),
    html: `<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"/><title>Plată confirmată</title></head>
<body style="font-family:Arial,sans-serif;color:#111827;background:#f9fafb;margin:0;padding:40px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#16a34a;color:#fff;padding:32px 40px;">
      <h1 style="margin:0;font-size:22px;">✅ Plată confirmată</h1>
    </div>
    <div style="padding:32px 40px;">
      <p>Mulțumim! Abonamentul tău a fost activat cu succes.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;color:#6b7280;">Plan</td><td style="font-weight:600;">${planName} (${cycleLabel})</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Sumă plătită</td><td style="font-weight:600;">${amount.toFixed(2)} ${currency}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">Valabil până la</td><td style="font-weight:600;">${periodEndFormatted}</td></tr>
      </table>
    </div>
    <div style="padding:20px 40px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
      <p>Devize Auto Koders · Acest email a fost generat automat.</p>
    </div>
  </div>
</body>
</html>`,
  });
}
