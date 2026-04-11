import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateNetopiaPayload } from "@/lib/netopia";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parsăm request-ul (din formular sau JSON fetch)
  let planId = "lunar";
  try {
    const formData = await req.formData();
    planId = formData.get("planId") as string || "lunar";
  } catch {
    const json = await req.json();
    planId = json.planId || "lunar";
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "No company profile found" }, { status: 400 });
  }

  // Preț abonament (80 RON lunar, 800 RON anual)
  const amount = planId === "anual" ? 800 : 80;
  
  // Generăm o ID unic de comandă pentru Netopia
  const timestamp = Date.now().toString();
  const orderId = `SUB_${profile.company_id}_${timestamp}`;

  // Actualizăm sau creăm draft-ul plății în subscriptions (dacă există)
  await supabase
    .from('subscriptions')
    .update({ 
      netopia_order_id: orderId,
      plan_id: planId
    })
    .eq('company_id', profile.company_id);

  // Domeniul aplicației tale (folosind VERCEL_URL sau domeniu hardcodat)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Generam payload-ul pt Netopia
  const netopiaPayload = generateNetopiaPayload({
    orderId,
    amount,
    currency: "RON",
    details: `Abonament ${planId} - Devize Auto Koders SaaS`,
    confirmUrl: `${baseUrl}/api/payments/netopia/ipn`, // Webhook-ul pe care-l apelează Netopia (ascuns, fără browser)
    returnUrl: `${baseUrl}/abonament?status=success`,     // Unde este redirectat clientul după plată (spre success page)
    billing: {
      firstName: userData.user.user_metadata?.first_name || "Client",
      lastName: userData.user.user_metadata?.last_name || "Auto",
      email: userData.user.email!,
      phone: "0000000000" // Aici poti prelua din profiles
    }
  });

  // Întrucât Netopia necesită un formular POST ce se trimite auto by browser
  // vom expune un HTML mic cu auto-submit catre URL-ul Netopiei
  const htmlForm = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Redirecționare Netopia...</title>
      </head>
      <body onload="document.forms[0].submit()">
        <p>Se redirecționează către procesatorul de plăți securizat...</p>
        <form action="${netopiaPayload.url}" method="POST">
          <input type="hidden" name="env_key" value="${netopiaPayload.envKey}"/>
          <input type="hidden" name="data" value="${netopiaPayload.data}"/>
          <noscript>
             <button type="submit">Click aici dacă nu sunteți redirecționat automat</button>
          </noscript>
        </form>
      </body>
    </html>
  `;

  return new NextResponse(htmlForm, {
    headers: { "Content-Type": "text/html" }
  });
}
