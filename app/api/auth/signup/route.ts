// app/api/auth/signup/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const accountName = formData.get('accountName') as string | null;
    const bankName = formData.get('bankName') as string | null;
    const accountNumber = formData.get('accountNumber') as string | null;
    const idFile = formData.get('idFile') as File | null;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, password' },
        { status: 400 }
      );
    }

    if (!idFile) {
      return NextResponse.json(
        { error: 'Government ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create auth user — triggers Supabase confirmation email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Upload ID file to beneficiary-ids storage bucket
    const fileBuffer = await idFile.arrayBuffer();
    const storageKey = `${userId}/${Date.now()}-${idFile.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('beneficiary-ids')
      .upload(storageKey, fileBuffer, {
        contentType: idFile.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `ID upload failed: ${uploadError.message}` },
        { status: 400 }
      );
    }

    // Step 3: Insert beneficiary_profiles row
    const { error: profileError } = await supabaseAdmin
      .from('beneficiary_profiles')
      .insert({
        auth_user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        account_name: accountName || null,
        bank_name: bankName || null,
        account_number: accountNumber || null,
        id_verification_key: storageKey,
        status: 'pending',
      });

    if (profileError) {
      return NextResponse.json(
        { error: `Profile creation failed: ${profileError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
