'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface BillingInfo {
  id: string;
  user_id: string;
  type: 'juridica' | 'fizica';
  company_name: string | null;
  cui: string | null;
  reg_com: string | null;
  first_name: string | null;
  last_name: string | null;
  address: string;
  city: string;
  county: string;
  email: string;
  phone: string;
}

export type BillingInfoInput =
  | {
      type: 'juridica';
      company_name: string;
      cui: string;
      reg_com?: string;
      address: string;
      city: string;
      county: string;
      email: string;
      phone: string;
    }
  | {
      type: 'fizica';
      first_name: string;
      last_name: string;
      address: string;
      city: string;
      county: string;
      email: string;
      phone: string;
    };

export async function saveBillingInfo(
  input: BillingInfoInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: 'Neautorizat' };

  // Build upsert payload
  const payload: Record<string, string | null> = {
    user_id: user.id,
    type: input.type,
    address: input.address,
    city: input.city,
    county: input.county,
    email: input.email,
    phone: input.phone,
    // Clear the other type's fields to avoid stale data
    company_name: null,
    cui: null,
    reg_com: null,
    first_name: null,
    last_name: null,
  };

  if (input.type === 'juridica') {
    payload.company_name = input.company_name;
    payload.cui = input.cui;
    payload.reg_com = input.reg_com ?? null;
  } else {
    payload.first_name = input.first_name;
    payload.last_name = input.last_name;
  }

  const { error } = await supabase
    .from('billing_info')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.error('[saveBillingInfo]', error);
    return { error: 'Nu s-au putut salva datele de facturare.' };
  }

  revalidatePath('/abonament');
  return {};
}
