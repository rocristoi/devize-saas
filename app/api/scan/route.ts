import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory cache avoiding re-charging OpenAI credits for the exact same image URL
const cache = new Map<string, unknown>();

async function scanWithOCR(imageUrl: string, hackaiKey: string) {
  if (cache.has(imageUrl)) {
    console.log('[ocr] cache hit for', imageUrl);
    return cache.get(imageUrl);
  }

  const response = await fetch('https://ai.hackclub.com/proxy/v1/ocr', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hackaiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "image_url",
        image_url: imageUrl
      },
      document_annotation_format: {
        type: "json_schema",
        json_schema: {
          name: "vehicle_registration",
          schema: {
            type: "object",
            properties: {
              license_plate_number: { type: ["string", "null"], description: "Field A (număr de înmatriculare)" },
              make: { type: ["string", "null"], description: "Field D.1 (marca)" },
              model: { type: ["string", "null"], description: "Field D.3 (modelul)" },
              vin: { type: ["string", "null"], description: "Field E (număr de identificare/VIN)" },
              engine_capacity_cc: { type: ["number", "null"], description: "Field F.1/P.1 (capacitatea cilindrică în cm3)" },
              color: { type: ["string", "null"], description: "Field R (culoarea)" },
              make_year: { type: ["number", "null"], description: "Year from field B (anul fabricației)" }
            },
            required: [
              "license_plate_number",
              "make",
              "model",
              "vin",
              "engine_capacity_cc",
              "color",
              "make_year"
            ],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[ocr] API Error:', text);
    throw new Error('OCR request failed: ' + response.statusText);
  }

  const data = await response.json();
  const raw = data.document_annotation || '{}';

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

  let result;
  try {
    result = JSON.parse(cleaned);
  } catch {
    console.error('[ocr] failed to parse response:', raw);
    throw new Error('OCR returned an unparseable response.');
  }

  if (result.license_plate_number) {
    result.license_plate_number = result.license_plate_number.replace(/-/g, '');
  }

  const normalised = {
    license_plate_number: result.license_plate_number ?? null,
    make: result.make ?? null,
    model: result.model ?? null,
    vin: result.vin ?? null,
    engine_capacity_cc: result.engine_capacity_cc != null ? Number(result.engine_capacity_cc) : null,
    color: result.color ?? null,
    make_year: result.make_year != null ? Number(result.make_year) : null,
  };

  cache.set(imageUrl, normalised);
  return normalised;
}

async function deleteImage(imageUrl: string, supabaseUrl: string, supabaseAdminKey: string) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);
    const BUCKET = 'talon-pics';
    
    const url = new URL(imageUrl);
    const segments = url.pathname.split('/');
    const bucketIndex = segments.indexOf(BUCKET);
    if (bucketIndex === -1) {
      console.warn('[storage] Could not locate bucket name in URL:', imageUrl);
      return;
    }
    const filePath = segments.slice(bucketIndex + 1).join('/');

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
    if (error) {
      console.warn('[storage] Delete failed:', error.message);
    } else {
      console.log('[storage] Deleted:', filePath);
    }
  } catch (err: unknown) {
    console.warn('[storage] Delete error:', err instanceof Error ? err.message : String(err));
  }
}

export async function POST(req: Request) {
  // 1. Authenticate
  const authHeader = req.headers.get('authorization') ?? '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    const cookieHeader = req.headers.get('cookie') ?? '';
    for (const part of cookieHeader.split(';')) {
      const [key, ...rest] = part.trim().split('=');
      if (key.trim() === 'sb-access-token') {
        token = rest.join('=').trim();
        break;
      }
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized. Provide a valid Supabase session token.' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hackaiKey = process.env.HACKAI_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !hackaiKey) {
    return NextResponse.json({ error: 'Server misconfiguration: missing Supabase or HackAI keys.' }, { status: 500 });
  }

  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token);

  if (authError || !authData?.user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // 2. Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const imageUrl = body?.image;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'Missing "image" field in request body.' }, { status: 400 });
  }

  // 3. Scan with OCR
  let result;
  try {
    result = await scanWithOCR(imageUrl, hackaiKey);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ocr] Error:', msg);
    return NextResponse.json({ error: 'OCR scan failed: ' + msg }, { status: 502 });
  }

  // 4. Delete image from bucket (Fire-and-forget)
  if (supabaseServiceKey) {
    deleteImage(imageUrl, supabaseUrl, supabaseServiceKey).catch(() => {});
  }

  // 5. Respond
  return NextResponse.json(result, { status: 200 });
}
