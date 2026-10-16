// Edge Function: operasi admin untuk manajemen user.
// Secret key hanya ada di server (env bawaan Supabase), tidak pernah
// dikirim ke browser. Pemanggil wajib login dan punya role 'admin'.
//
// Deploy dengan verify_jwt = false: verifikasi JWT bawaan platform hanya
// mengenali legacy key. Otorisasi dilakukan di requireAdmin().
import { createClient } from 'npm:@supabase/supabase-js@2';

type AppRole = 'admin' | 'nakes' | 'apoteker' | 'farmasi';
const VALID_ROLES: AppRole[] = ['admin', 'nakes', 'apoteker', 'farmasi'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function validatePassword(password: unknown): string {
  if (typeof password !== 'string') throw new HttpError(400, 'Password wajib diisi');
  if (password.length < 8) throw new HttpError(400, 'Password minimal 8 karakter');
  if (!/[A-Z]/.test(password)) throw new HttpError(400, 'Password harus mengandung huruf besar');
  if (!/[a-z]/.test(password)) throw new HttpError(400, 'Password harus mengandung huruf kecil');
  if (!/[0-9]/.test(password)) throw new HttpError(400, 'Password harus mengandung angka');
  return password;
}

function validateRoles(roles: unknown): AppRole[] {
  if (!Array.isArray(roles)) throw new HttpError(400, 'Role tidak valid');
  const unique = Array.from(new Set(roles));
  if (unique.length === 0) throw new HttpError(400, 'Pilih minimal satu role');
  if (!unique.every((r) => VALID_ROLES.includes(r as AppRole))) {
    throw new HttpError(400, 'Role tidak valid');
  }
  return unique as AppRole[];
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `${field} wajib diisi`);
  }
  return value.trim();
}

// Pakai secret key baru (sb_secret_...); legacy service_role hanya cadangan
// selama project belum punya secret key bernama 'default'.
function getAdminKey(): string {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  const secretKey = secretKeys ? JSON.parse(secretKeys)['default'] : undefined;
  if (secretKey) {
    console.log('admin-users: using secret key');
    return secretKey;
  }
  console.warn('admin-users: SUPABASE_SECRET_KEYS default not found, falling back to legacy service_role key');
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  getAdminKey(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function requireAdmin(req: Request): Promise<string> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'Tidak terautentikasi');

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) throw new HttpError(401, 'Sesi tidak valid, silakan login ulang');

  const { data: roles, error: rolesError } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin');
  if (rolesError) throw rolesError;
  if (!roles || roles.length === 0) throw new HttpError(403, 'Hanya admin yang boleh melakukan aksi ini');

  return user.id;
}

async function syncRoles(userId: string, roles: AppRole[]) {
  const { error: deleteError } = await admin.from('user_roles').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;
  const { error: insertError } = await admin
    .from('user_roles')
    .insert(roles.map((role) => ({ user_id: userId, role })));
  if (insertError) throw insertError;
}

async function createUser(body: Record<string, unknown>) {
  const email = requireString(body.email, 'Email');
  const fullName = requireString(body.fullName, 'Nama');
  const password = validatePassword(body.password);
  const roles = validateRoles(body.roles);
  const primaryRole = roles[0];

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: primaryRole, roles },
  });
  if (error) throw new HttpError(400, error.message);

  const now = new Date().toISOString();
  const { error: profileError } = await admin.from('profiles').upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    role: primaryRole,
    created_at: now,
    updated_at: now,
  });
  if (profileError) throw profileError;

  await syncRoles(data.user.id, roles);
  return { id: data.user.id };
}

async function updateUser(body: Record<string, unknown>) {
  const userId = requireString(body.userId, 'User');
  const fullName = requireString(body.fullName, 'Nama');
  const email = requireString(body.email, 'Email');
  const roles = validateRoles(body.roles);

  const { data: existing, error: fetchError } = await admin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();
  if (fetchError) throw new HttpError(404, 'Pengguna tidak ditemukan');

  // Email login (auth.users) ikut diganti supaya sama dengan profil
  if (existing.email !== email) {
    const { error } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
    if (error) throw new HttpError(400, error.message);
  }

  const { data, error } = await admin
    .from('profiles')
    .update({ full_name: fullName, email, role: roles[0], updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;

  await syncRoles(userId, roles);
  return data;
}

async function deleteUser(body: Record<string, unknown>, callerId: string) {
  const userId = requireString(body.userId, 'User');
  if (userId === callerId) throw new HttpError(400, 'Tidak bisa menghapus akun sendiri');

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new HttpError(400, error.message);
  return { id: userId };
}

async function setPassword(body: Record<string, unknown>) {
  const userId = requireString(body.userId, 'User');
  const password = validatePassword(body.password);

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) throw new HttpError(400, error.message);
  return { id: userId };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const callerId = await requireAdmin(req);
    const body = await req.json().catch(() => {
      throw new HttpError(400, 'Body harus JSON');
    });

    switch (body.action) {
      case 'create':
        return json(200, await createUser(body));
      case 'update':
        return json(200, await updateUser(body));
      case 'delete':
        return json(200, await deleteUser(body, callerId));
      case 'set_password':
        return json(200, await setPassword(body));
      default:
        throw new HttpError(400, 'Aksi tidak dikenal');
    }
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error(err);
    return json(500, { error: 'Terjadi kesalahan di server' });
  }
});
