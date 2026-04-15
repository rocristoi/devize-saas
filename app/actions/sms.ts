"use server";

import { createClient } from "@/lib/supabase/server";

export async function sendSmsFormAction(
  devizId: string,
  phone: string,
  message: string
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_id')
    .eq('id', userData.user.id)
    .single();

  if (!profile?.company_id) {
    return { success: false, error: "Company profile not found" };
  }

  // Check company-level SMS rate limit
  const { data: company } = await supabase
    .from('companies')
    .select('sms_sent_count')
    .eq('id', profile.company_id)
    .single();

  const SMS_LIMIT = 250;
  if (company && (company.sms_sent_count ?? 0) >= SMS_LIMIT) {
    return {
      success: false,
      error: "Limita de SMS-uri a contului dvs. a fost atinsă. Vă rugăm să ne contactați pentru a aloca mai multe SMS-uri.",
    };
  }

  // Check how many SMS were already sent for this deviz
  const { data: deviz } = await supabase
    .from('devize')
    .select('sms_sent_count')
    .eq('id', devizId)
    .single();

  if (!deviz) {
    return { success: false, error: "Deviz not found" };
  }

  if (deviz.sms_sent_count && deviz.sms_sent_count >= 1) {
    return { success: false, error: "Acest deviz a fost deja trimis. Pentru a retrimite un SMS, trebuie să editați devizul mai întâi." };
  }

  const apiKey = process.env.SMSTO_API_KEY;
  if (!apiKey) {
    return { success: false, error: "SMS service is not configured." };
  }

  // Format Romaninan phone number
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('07')) {
    cleaned = '+40' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    // If it's something else, try to prepend + for international format
    // But primarily handle romanian 07
    if (cleaned.startsWith('40')) {
      cleaned = '+' + cleaned;
    } else {
      // Just fallback
      cleaned = '+40' + cleaned;
    }
  }

  try {
    const response = await fetch("https://api.sms.to/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        message,
        to: cleaned,
        sender_id: process.env.SMSTO_SENDER_ID || "Koders"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("SMS.to error:", data);
      
      const { error: auditErr } = await supabase.from('sms_audit').insert({
        deviz_id: devizId,
        company_id: profile.company_id,
        phone: cleaned,
        status: 'error',
        error_message: data.message || "Failed to send SMS."
      });

      if (auditErr) {
        console.error("SMS audit insert error:", auditErr);
      }

      return { success: false, error: data.message || "Failed to send SMS." };
    }

    const { error: auditErr } = await supabase.from('sms_audit').insert({
      deviz_id: devizId,
      company_id: profile.company_id,
      phone: cleaned,
      status: 'success'
    });

    if (auditErr) {
      console.error("SMS audit insert error:", auditErr);
    }

    await supabase.rpc('increment_deviz_sms_count', { deviz_row_id: devizId });
    // Or simpler update if rpc doesn't exist
    await supabase
      .from('devize')
      .update({ sms_sent_count: (deviz.sms_sent_count || 0) + 1 })
      .eq('id', devizId);

    // Increment company-level SMS counter
    await supabase
      .from('companies')
      .update({ sms_sent_count: (company?.sms_sent_count ?? 0) + 1 })
      .eq('id', profile.company_id);

    return { success: true };
  } catch (error: any) {
    console.error("SMS send error:", error);
    
    const { error: auditErr } = await supabase.from('sms_audit').insert({
      deviz_id: devizId,
      company_id: profile.company_id,
      phone: cleaned,
      status: 'error',
      error_message: "An error occurred while sending the SMS."
    });

    if (auditErr) {
      console.error("SMS audit insert error:", auditErr);
    }

    return { success: false, error: "An error occurred while sending the SMS." };
  }
}
