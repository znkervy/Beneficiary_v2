// app/api/auth/login/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Authenticate credentials
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          { error: 'Please confirm your email before logging in.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Step 2: Check approval status in beneficiary_profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('beneficiary_profiles')
      .select('status')
      .eq('auth_user_id', data.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. You can log in once approved.' },
        { status: 403 }
      );
    }

    if (profile.status === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. You can log in once approved.' },
        { status: 403 }
      );
    }

    if (profile.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your account application was not approved. Please contact support.' },
        { status: 403 }
      );
    }

    // status === 'approved' — return session tokens for client to set
    return NextResponse.json(
      {
        success: true,
        session: {
          access_token: data.session!.access_token,
          refresh_token: data.session!.refresh_token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
