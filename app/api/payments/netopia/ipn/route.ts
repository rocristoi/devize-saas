import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// IPN - Instant Payment Notification (Webhook-ul invizibil pe care-l dă server-ul lor server-ului tău)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const env_key = formData.get("env_key") as string;
    const data = formData.get("data") as string;

    if (!env_key || !data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Decriptare RC4 utilizând Cheia ta Privată RSA de la Netopia
    const PRIVATE_KEY = process.env.NETOPIA_PRIVATE_KEY || "";
    if (PRIVATE_KEY) {
      // Decode the AES/RC4 key
      const rc4Key = crypto.privateDecrypt({
        key: PRIVATE_KEY,
        padding: crypto.constants.RSA_PKCS1_PADDING
      }, Buffer.from(env_key, "base64"));

      // 2. Decodificare Payload XML XML folosind cheia RC4 decriptată
      const decipher = crypto.createDecipheriv("rc4", rc4Key, "");
      let decodedXml = decipher.update(data, "base64", "utf8");
      decodedXml += decipher.final("utf8");

      // Folosind regex sau xml2js putem afla orderId și statusul din <order id="..." status="confirmed"> etc.
      console.log("[Webhook Netopia] Date primite XML:", decodedXml);
    } else {
      console.warn("Nu ai NETOPIA_PRIVATE_KEY. Folosim confirmare temporară de test pentru MOCK.");
    }

    // SUPABASE SERVICE ROLE (ca să scriem IPN bypass-ând RLS de user)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Din lipsă de cheie, testăm cu 'data' primită din query params (Doar demo) sau o validăm după id-ul planificat (Ex: SUB_XYZ_)
    // În realitate, extras din XML preluăm:
    // const orderId = extrageOrderId(decodedXml); 
    // const paymentStatus = extrageStatus(decodedXml); // "confirmed"

    // Pentru implementare test MOCK vom găsi toate activele trial 
    // și le vom valida dându-le "active" - doar demonstrație de cod sigur.

    // Aici se face UPDATE-ul în baza de date cu "active" pe abomament
    // if (paymentStatus === 'confirmed')
    /*
      await supabaseAdmin
        .from('subscriptions')
        .update({ 
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: PLAN_IS_LUNAR ? (Now + 30Days) : (Now + 365Days) 
        })
        .eq('netopia_order_id', orderId);
    */

    // Pentru sistemul de Răspuns cerut de Netopia
    // Serverul lor va da timeout dacă nu returnăm un XML fix format din succes:
    const responseXml = `<?xml version="1.0" encoding="utf-8"?>
<crc error_type="0" error_code="0">Success</crc>`;

    return new NextResponse(responseXml, {
        headers: { "Content-Type": "application/xml" }
    });

  } catch (error: any) {
    console.error("Netopia IPN Webhook Error", error);
    const errXml = `<?xml version="1.0" encoding="utf-8"?>
<crc error_type="1" error_code="1">${error.message}</crc>`;
    
    return new NextResponse(errXml, {
        headers: { "Content-Type": "application/xml" },
        status: 500
    });
  }
}
