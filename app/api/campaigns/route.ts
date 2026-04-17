// app/api/campaigns/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('hc_campaigns')
    .select('id, title')
    .eq('status', 'active')
    .order('title', { ascending: true });

  if (error) {
    console.error('[campaigns] fetch error:', error.message);
    return NextResponse.json({ error: 'Failed to load campaigns.' }, { status: 500 });
  }

  return NextResponse.json({ campaigns: data ?? [] });
}
