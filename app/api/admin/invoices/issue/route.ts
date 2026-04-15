/**
 * POST /api/admin/invoices/issue
 *
 * Admin-only endpoint to manually issue a pending invoice.
 * Protected by ADMIN_API_SECRET in Authorization header.
 *
 * Body (JSON):
 *   {
 *     invoice_id: string,
 *     invoice_number: string,
 *     pdf_url: string,
 *     notes?: string
 *   }
 *
 * On success:
 *   - Sets invoice status = "issued", issued_at = now
 *   - Sends email to the invoice owner with the PDF link
 *   - Returns the updated invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/billing';
import { sendInvoiceIssuedEmail } from '@/lib/email';
import type { IssueInvoiceRequest } from '@/types/billing';

const ADMIN_SECRET = process.env.ADMIN_API_SECRET;

export async function POST(req: NextRequest) {
  // ── 1. Auth: require secret API key ──────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const secret = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: IssueInvoiceRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { invoice_id, invoice_number, pdf_url, notes } = body;

  if (!invoice_id || !invoice_number || !pdf_url) {
    return NextResponse.json(
      { error: 'invoice_id, invoice_number, and pdf_url are required' },
      { status: 400 },
    );
  }

  const db = getAdminSupabase();

  // ── 3. Fetch invoice ──────────────────────────────────────────────────────
  const { data: invoice, error: fetchErr } = await db
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .single();

  if (fetchErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.status === 'issued') {
    return NextResponse.json({ error: 'Invoice already issued' }, { status: 409 });
  }

  if (invoice.status === 'canceled') {
    return NextResponse.json({ error: 'Cannot issue a canceled invoice' }, { status: 422 });
  }

  // ── 4. Check invoice_number uniqueness ────────────────────────────────────
  const { data: duplicate } = await db
    .from('invoices')
    .select('id')
    .eq('invoice_number', invoice_number)
    .neq('id', invoice_id)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { error: `Invoice number "${invoice_number}" is already assigned to another invoice` },
      { status: 409 },
    );
  }

  // ── 5. Update invoice ─────────────────────────────────────────────────────
  const now = new Date().toISOString();

  const { data: updated, error: updateErr } = await db
    .from('invoices')
    .update({
      status: 'issued',
      invoice_number,
      issued_at: now,
      pdf_url,
      notes: notes ?? null,
    })
    .eq('id', invoice_id)
    .select()
    .single();

  if (updateErr || !updated) {
    console.error('[admin/invoices/issue] update error:', updateErr);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }

  // ── 6. Send email notification (best-effort) ──────────────────────────────
  try {
    // Fetch the user's email via Supabase Admin Auth API
    const { data: userRecord } = await db.auth.admin.getUserById(updated.user_id);
    const email = userRecord?.user?.email;

    if (email) {
      await sendInvoiceIssuedEmail({
        to: email,
        invoiceNumber: invoice_number,
        amount: updated.amount,
        currency: updated.currency ?? 'RON',
        pdfUrl: pdf_url,
      });
      console.info(`[admin/invoices/issue] Email sent to ${email} for invoice ${invoice_number}`);
    } else {
      console.warn(`[admin/invoices/issue] No email found for user ${updated.user_id}`);
    }
  } catch (emailErr) {
    // Non-fatal — invoice is already issued; log and continue
    console.error('[admin/invoices/issue] Failed to send email:', emailErr);
  }

  return NextResponse.json({
    success: true,
    invoice: updated,
  });
}
