// ============================================================
// Billing System — TypeScript Types
// ============================================================

export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'trialing' | 'active' | 'overdue' | 'expired' | 'canceled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type InvoiceStatus = 'pending' | 'issued' | 'canceled';
export type CouponType = 'percentage' | 'fixed';

// ── Plans ────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  trial_days: number;
  is_active: boolean;
  created_at: string;
}

// ── Subscriptions ────────────────────────────────────────────

export interface BillingSubscription {
  id: string;
  user_id: string;
  company_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  // Stripe fields
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  // joined
  plan?: Plan;
}

// ── Payments ─────────────────────────────────────────────────

export interface BillingPayment {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: 'stripe' | 'netopia';
  provider_payment_id: string | null;
  stripe_invoice_id: string | null;
  provider_response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// ── Invoices ─────────────────────────────────────────────────

export interface Invoice {
  id: string;
  user_id: string;
  company_id: string;
  subscription_id: string;
  payment_id: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  invoice_number: string | null;
  issued_at: string | null;
  due_date: string;
  pdf_url: string | null;
  admin_note: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Coupons ──────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

// ── Coupon Redemptions ────────────────────────────────────────

export interface CouponRedemption {
  id: string;
  user_id: string;
  coupon_id: string;
  payment_id: string | null;
  used_at: string;
}

// ── Create Payment Request ────────────────────────────────────

export interface CreatePaymentRequest {
  plan_id: string;
  billing_cycle: BillingCycle;
  coupon_code?: string;
}
// ── API Request / Response shapes ────────────────────────────

export interface CreatePaymentRequest {
  plan_id: string;
  billing_cycle: BillingCycle;
  coupon_code?: string;
}

export interface CreatePaymentResponse {
  payment_id: string;
  subscription_id: string;
  invoice_id: string;
  redirect_url: string;         // HTML page that auto-posts to Netopia
  amount_charged: number;
  original_amount: number;
  discount_applied: number;
  currency: string;
}

export interface IssueInvoiceRequest {
  invoice_id: string;
  invoice_number: string;
  pdf_url: string;
  notes?: string;
}

export interface CheckExpiredResult {
  processed: number;
  overdue: string[];
  expired: string[];
}

// ── Netopia IPN parsed payload ────────────────────────────────

export interface NetopiaIpnData {
  orderId: string;
  status: 'confirmed' | 'paid' | 'canceled' | 'credit' | 'pending' | string;
  amount: number;
  currency: string;
  errorCode: number;
  errorMessage: string;
  timestamp: string;
}
