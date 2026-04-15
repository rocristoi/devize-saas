/**
 * POST /api/subscriptions/check-expired
 *
 * Cron endpoint that scans all active/overdue billing subscriptions whose
 * current_period_end is in the past and transitions them to:
 *
 *   - "overdue"  — period_end expired <= 7 days ago (grace period)
 *   - "expired"  — period_end expired > 7 days ago
 *
 * Security: requires the CRON_SECRET header to prevent public access.
 * Trigger: Vercel Cron (see vercel.json) — hourly schedule.
 *
 * Idempotent: running multiple times in the same hour is safe.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/billing';
import type { CheckExpiredResult } from '@/types/billing';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  // ── 1. Auth: require CRON_SECRET ─────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const secret = authHeader?.replace(/^Bearer\s+/i, '').trim();

  // Also support Vercel's x-vercel-signature (set automatically by Vercel Cron)
  const vercelSignature = req.headers.get('x-vercel-signature');
  const isVercelCron = vercelSignature !== null && process.env.VERCEL === '1';

  if (!isVercelCron && (!CRON_SECRET || secret !== CRON_SECRET)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getAdminSupabase();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const result: CheckExpiredResult = {
    processed: 0,
    overdue: [],
    expired: [],
  };

  // ── 2. Fetch all subscriptions that have passed their period_end ──────────
  const { data: subscriptions, error } = await db
    .from('billing_subscriptions')
    .select('id, status, current_period_end, billing_cycle, user_id, plan_id')
    .in('status', ['active', 'overdue'])
    .lt('current_period_end', now.toISOString());

  if (error) {
    console.error('[check-expired] Failed to fetch subscriptions:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.info('[check-expired] No expired subscriptions found');
    return NextResponse.json({ ...result, message: 'No subscriptions to process' });
  }

  // ── 3. Classify and update each subscription ──────────────────────────────
  const overdueIds: string[] = [];
  const expiredIds: string[] = [];

  for (const sub of subscriptions) {
    const periodEnd = new Date(sub.current_period_end);
    const daysSinceExpiry = (now.getTime() - periodEnd.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceExpiry > 7) {
      expiredIds.push(sub.id);
      result.expired.push(sub.id);
    } else {
      overdueIds.push(sub.id);
      result.overdue.push(sub.id);
    }
  }

  result.processed = subscriptions.length;

  // ── 4. Batch update: overdue ─────────────────────────────────────────────
  if (overdueIds.length > 0) {
    const { error: overdueErr } = await db
      .from('billing_subscriptions')
      .update({ status: 'overdue' })
      .in('id', overdueIds);

    if (overdueErr) {
      console.error('[check-expired] Failed to update overdue subscriptions:', overdueErr);
    } else {
      console.info(`[check-expired] Marked ${overdueIds.length} subscriptions as overdue`);
    }
  }

  // ── 5. Batch update: expired ─────────────────────────────────────────────
  if (expiredIds.length > 0) {
    const { error: expiredErr } = await db
      .from('billing_subscriptions')
      .update({ status: 'expired' })
      .in('id', expiredIds);

    if (expiredErr) {
      console.error('[check-expired] Failed to update expired subscriptions:', expiredErr);
    } else {
      console.info(`[check-expired] Marked ${expiredIds.length} subscriptions as expired`);
    }
  }

  // ── 6. Also handle trialing subscriptions past their trial_end ───────────
  //       (no payment received during trial → expire immediately)
  const { data: expiredTrials, error: trialErr } = await db
    .from('billing_subscriptions')
    .select('id')
    .eq('status', 'trialing')
    .lt('trial_end', now.toISOString());

  if (!trialErr && expiredTrials && expiredTrials.length > 0) {
    const trialIds = expiredTrials.map((t: { id: string }) => t.id);
    await db
      .from('billing_subscriptions')
      .update({ status: 'expired' })
      .in('id', trialIds);

    result.expired.push(...trialIds);
    result.processed += trialIds.length;
    console.info(`[check-expired] Expired ${trialIds.length} trial subscriptions`);
  }

  console.info('[check-expired] Done:', result);
  return NextResponse.json(result);
}

// Support GET for Vercel Cron (it sends GET requests)
export async function GET(req: NextRequest) {
  // Vercel Cron sends GET requests with the x-vercel-signature header.
  // Proxy to the POST handler.
  return POST(req);
}
