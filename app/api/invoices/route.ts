/**
 * GET /api/invoices
 *
 * Returns all invoices for the authenticated user, ordered by created_at desc.
 * Supports optional query parameters:
 *   ?status=pending|issued|canceled   — filter by status
 *   ?limit=20                          — page size (default 20, max 100)
 *   ?offset=0                          — pagination offset
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminSupabase } from '@/lib/billing';

export async function GET(req: NextRequest) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Query params ───────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0);

  const validStatuses = ['pending', 'issued', 'canceled'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 },
    );
  }

  // ── 3. Query invoices (using service-role for consistent access) ──────────
  const db = getAdminSupabase();

  let query = db
    .from('invoices')
    .select(
      `
      id,
      amount,
      currency,
      status,
      invoice_number,
      issued_at,
      due_date,
      pdf_url,
      notes,
      created_at,
      payment_id,
      subscription_id,
      billing_subscriptions (
        billing_cycle,
        current_period_start,
        current_period_end,
        plans ( name )
      )
    `,
      { count: 'exact' },
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: invoices, error, count } = await query;

  if (error) {
    console.error('[GET /api/invoices] query error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }

  return NextResponse.json({
    invoices: invoices ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
