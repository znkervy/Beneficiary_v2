// app/api/auth/signup/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Raise Next.js body size limit to accommodate ID file uploads up to 5 MB
export const maxDuration = 30;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'pdf']);
const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

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

    // Validate file size before buffering (cheap check)
    if (idFile.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'ID file must be under 5 MB.' }, { status: 400 });
    }

    // Validate and sanitise file extension — never trust client-supplied name or MIME type
    const rawExt = idFile.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      return NextResponse.json(
        { error: 'ID must be a JPG, PNG, or PDF file.' },
        { status: 400 }
      );
    }
    const safeExt = rawExt;
    const contentType = MIME_MAP[safeExt]!;

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
      console.error('[signup] auth.signUp error:', authError.message);
      return NextResponse.json(
        { error: 'Registration failed. Please check your details and try again.' },
        { status: 400 }
      );
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: 'Failed to create user account. Please try again.' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Upload ID file to beneficiary-ids storage bucket
    // Use only the sanitised extension — never embed the user-supplied filename
    const storageKey = `${userId}/${Date.now()}.${safeExt}`;
    const fileBuffer = await idFile.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('beneficiary-ids')
      .upload(storageKey, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[signup] storage upload error:', uploadError.message);
      // Compensating action: remove the orphaned auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'ID upload failed. Please try again.' },
        { status: 500 }
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
      console.error('[signup] profile insert error:', profileError.message);
      // Compensating actions: remove orphaned auth user and uploaded file
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.storage.from('beneficiary-ids').remove([storageKey]);
      return NextResponse.json(
        { error: 'Account setup failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
