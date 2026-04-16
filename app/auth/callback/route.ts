// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error('Callback error:', error?.message ?? 'No session returned');
    return NextResponse.redirect(new URL('/login?error=expired', origin));
  }

  return NextResponse.redirect(new URL('/login?confirmed=true', origin));
}
