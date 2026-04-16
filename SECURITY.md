# Security Audit Report

---

## 🔴 Critical Vulnerabilities

### 1. ✅ FIXED — Unauthenticated HTML-to-PDF Endpoint (`/api/generate-pdf`)

**File:** `app/api/generate-pdf/route.ts`

The `POST /api/generate-pdf` route accepted arbitrary `html` from the request body and proxied it to the internal PDF rendering service **with zero authentication**.

**Impact:**
- Anyone on the internet could generate unlimited PDFs (DoS, cost abuse)
- Phishing documents branded as your service
- SSRF against the internal PDF renderer (headless Chrome fetches Tailwind CDN, Google Fonts)
- `Content-Disposition` header injection via unvalidated `filename` field

**Fix applied:** Authentication check via `supabase.auth.getUser()` added. Filename sanitized with `replace(/[^\w\-. ]/g, '_')`.

---

### 2. ✅ FIXED — Cron Secret Bypass — Subscription Expiry Endpoint

**File:** `app/api/subscriptions/check-expired/route.ts`

The `x-vercel-signature` header was **never cryptographically verified** — its mere presence bypassed the `CRON_SECRET` check on all Vercel deployments (`VERCEL=1` is always set).

**Impact:** Any unauthenticated user could trigger the subscription expiry sweep at will (DoS, information leak).

**Fix applied:** Removed the `isVercelCron` bypass entirely. Vercel Cron sends the `Authorization: Bearer <CRON_SECRET>` header automatically when configured in `vercel.json`.

---

### 3. ✅ FIXED — Stored XSS Injected Into PDF HTML Template

**File:** `lib/pdfGenerator.ts`

`generateWebDeviz` built an HTML string by directly interpolating **unescaped database values** (client name, vehicle plate, deviz notes, etc.).

**Impact:** Injecting `<script>` tags executes JavaScript inside the headless Chrome PDF renderer, enabling SSRF against the internal network. If the HTML is ever served in a browser preview, it becomes stored XSS with cookie theft.

**Fix applied:** All interpolated values are passed through an `escapeHtml()` helper that encodes `< > & " '`.

---

### 4. ✅ FIXED — `subscriptions` Table INSERT Policy — Subscription Bypass

**File:** `supabase/schema.sql` → `supabase/security_hardening.sql`

```sql
-- OLD (insecure)
CREATE POLICY "Users can insert subscription" ON subscriptions 
  FOR INSERT TO authenticated WITH CHECK (true);
```

`WITH CHECK (true)` allowed any authenticated user to insert a `subscriptions` row with any `company_id` and any `status`, granting themselves permanent free access.

**Fix applied** in `security_hardening.sql`:
```sql
CREATE POLICY "Users can insert subscription" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = get_my_company_id()
    AND status = 'trialing'
  );
```

---

## 🟠 High Severity

### 5. ✅ FIXED — Any Anonymous User Can Overwrite Any Pending Upload Session

**File:** `supabase/schema.sql` → `supabase/security_hardening.sql`

```sql
-- OLD (insecure) — no ownership check, no WITH CHECK clause
CREATE POLICY "Enable update for all" ON upload_sessions 
  FOR UPDATE USING (true);
```

Any unauthenticated user could overwrite any pending upload session, injecting a malicious `image_url` to feed fake OCR data (forged VIN, license plate) to a mechanic's scan workflow.

**Fix applied** in `security_hardening.sql`:
```sql
CREATE POLICY "Public can update pending upload session" ON upload_sessions
  FOR UPDATE
  USING (status = 'pending')
  WITH CHECK (
    status IN ('completed', 'failed')
    AND company_id = (SELECT company_id FROM upload_sessions s2 WHERE s2.id = upload_sessions.id)
  );
```

---

### 6. ✅ FIXED — `Content-Disposition` Header Injection via User-Controlled Filename

**Files:** `app/api/deviz/public-pdf/route.ts`, `app/api/deviz/[id]/pdf/route.ts`

`pdf_filename` is a user-controlled company setting. A value containing `"\r\n"` could inject arbitrary HTTP response headers.

**Fix applied:** Filename sanitized with `replace(/[^\w\-. ]/g, '_').substring(0, 100)` and encoded with RFC 5987 `filename*=UTF-8''...` format.

---

### 7. ✅ FIXED — No File Type or Size Validation on Logo Upload

**File:** `app/onboarding/actions.ts`

An attacker could upload an SVG with embedded JavaScript or a fake PNG (wrong magic bytes) with the browser-declared MIME type. The file was stored and its public URL embedded in PDFs and pages.

**Fix applied:**
- MIME allowlist: `image/jpeg`, `image/png`, `image/webp`
- Max size: 2 MB
- Magic byte validation (PNG `\x89PNG`, JPEG `\xff\xd8`, WebP `RIFF....WEBP`)
- Extension derived from magic bytes, not from the user-supplied filename

---

### 8. ✅ FIXED — Unbounded `signature_data` Payload in Public Sign Endpoint

**File:** `app/api/deviz/sign/route.ts`

No size limit was enforced on `signature_data`. An attacker with a valid `public_token` could submit a gigabyte-scale base64 payload, exhausting Node.js process memory (DoS). The endpoint also leaked raw JS error messages to callers.

**Fix applied:**
- `Content-Length` header checked before reading body (max 500 KB)
- Decoded buffer limited to 300 KB
- PNG magic byte validation before storage upload
- Generic error message returned on 500 (no internal details leaked)

---

### 9. ✅ FIXED — `GRANT ALL PRIVILEGES TO anon` on All Tables

**File:** `supabase/schema.sql` → `supabase/security_hardening.sql`

```sql
-- OLD (insecure)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
```

The `anon` role (unauthenticated requests) had INSERT/UPDATE/DELETE/TRUNCATE on every table. RLS was the only barrier — any future table without an explicit policy would be fully public.

**Fix applied** in `security_hardening.sql`:
```sql
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.upload_sessions TO anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
```

---

## 🟡 Medium / Low

### 10. ✅ FIXED — Series Counter Race Condition (Data Integrity)

**File:** `app/actions/deviz.ts`

Non-atomic read-then-write on `companies.current_series_counter` meant two concurrent deviz creations could get the same series number.

**Fix applied:** Replaced with an atomic `UPDATE … RETURNING` via `supabase.rpc('increment_series_counter', …)`.

---

### 11. ✅ FIXED — SMS Message Content Not Validated

**File:** `app/actions/sms.ts`

No length or type checks on `devizId`, `phone`, or `message` parameters — an authenticated user could craft an arbitrarily long message causing unexpected SMS gateway charges.

**Fix applied:** Message validated as non-empty string, capped at 640 characters (4 SMS segments). All three parameters are type-checked at entry.

---

## 🔵 Supabase Linter Findings — All Fixed via `supabase/security_hardening.sql`

### S1. ✅ FIXED — Function Search Path Mutable

**Affected functions:** `public.get_my_company_id`, `public.set_updated_at`, `public.set_updated_at_billing`

Without `SET search_path = ''`, a malicious DB user could create a shadow function in the `public` schema to hijack `SECURITY DEFINER` calls (search path injection).

**Fix:** All three functions recreated with `SET search_path = ''`.

---

### S2. ✅ FIXED — RLS Policy Always True (`companies` INSERT)

`WITH CHECK (true)` on `companies` INSERT allowed any authenticated user to create unlimited company rows.

**Fix:** Policy now requires the user to have no existing `company_id` in `user_profiles` (onboarding path only).

---

### S3. ✅ FIXED — RLS Policy Always True (`upload_sessions` UPDATE)

Covered by finding #5 above. The `"Enable update for all"` policy (fully permissive USING + WITH CHECK) was dropped and replaced with a scoped policy.

---

### S4. ✅ FIXED — Public Buckets Allow File Listing

**Affected buckets:** `logos`, `signatures`, `talon-pics`

Broad `SELECT` policies on `storage.objects` allowed any client to enumerate all files in the bucket — exposing client signature filenames, logo paths, and scan image URLs.

**Fix applied** in `security_hardening.sql`:
- `logos`: SELECT restricted to non-empty object names (direct URL access still works, directory listing blocked)
- `signatures`: restricted to `authenticated` role only (client signatures are PII)
- `talon-pics`: restricted to `authenticated` role only

---

### S5. ⚠️ ACTION REQUIRED — Leaked Password Protection Disabled

**This cannot be fixed via SQL migration.** Enable it in the Supabase Dashboard:

> **Authentication → Sign In / Up → Password Security → Enable "Leaked Password Protection"**

This checks new passwords against HaveIBeenPwned.org and rejects known compromised passwords.

---

## ✅ Secure Patterns Observed

- **Stripe webhook signature verification** uses `stripe.webhooks.constructEvent` with raw body — not parsed body.
- **Server actions gate on `supabase.auth.getUser()`** — not `getSession()`, which can be spoofed client-side.
- **RLS is enabled** on all tables with tenant-isolation via `get_my_company_id()`.
- **`lib/billing.ts` is marked `server-only`** — prevents accidental import in client bundles.
- **`SUPABASE_SERVICE_ROLE_KEY` never uses the `NEXT_PUBLIC_` prefix** — stays server-side only.
- **Admin invoice endpoint** uses a bearer secret, not session auth (correct for server-to-server calls).
