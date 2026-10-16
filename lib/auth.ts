/**
 * Authentication utilities for Supabase
 * Handles login, logout, and user session management
 */

import type { User } from '@supabase/supabase-js';
import type { Tables } from './database.types';
import { supabase } from './supabaseClient';

// Baris profiles ditambah daftar role dari user_roles. Kolom profiles.role
// adalah role lama (satu nilai) dan hanya dipakai sebagai cadangan.
export type UserProfile = Tables<'profiles'> & { roles: string[] };

type AppRole = 'admin' | 'nakes' | 'apoteker' | 'farmasi';

/**
 * Rate limiting storage key
 */
const RATE_LIMIT_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  lockedUntil?: number;
}

/**
 * Sign in with email and password
 * Includes rate limiting to prevent brute force attacks
 */
export async function signIn(email: string, password: string) {
  // Check rate limit
  const rateLimitData = localStorage.getItem(RATE_LIMIT_KEY);
  const rateLimit: Record<string, RateLimitEntry> = rateLimitData ? JSON.parse(rateLimitData) : {};

  if (rateLimit[email]?.lockedUntil && Date.now() < rateLimit[email].lockedUntil) {
    const remaining = Math.ceil((rateLimit[email].lockedUntil - Date.now()) / 60000);
    throw new Error(
      `Akun terkunci setelah terlalu banyak percobaan gagal. Coba lagi dalam ${remaining} menit.`,
    );
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Track failed attempt
      if (!rateLimit[email]) {
        rateLimit[email] = { attempts: 0, lastAttempt: Date.now() };
      }
      rateLimit[email].attempts++;
      rateLimit[email].lastAttempt = Date.now();

      if (rateLimit[email].attempts >= MAX_ATTEMPTS) {
        rateLimit[email].lockedUntil = Date.now() + LOCKOUT_DURATION;
      }

      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimit));
      throw error;
    }

    // Clear rate limit on success
    delete rateLimit[email];
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(rateLimit));
    return data;
  } catch (error) {
    // Translate common Supabase errors to Indonesian
    const message = (error as { message?: string } | null)?.message;
    if (message?.includes('Invalid login credentials')) {
      throw new Error('Email atau password salah', { cause: error });
    }
    if (message?.includes('Email not confirmed')) {
      throw new Error('Email belum dikonfirmasi', { cause: error });
    }
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  return session?.user ?? null;
}

/**
 * Get user profile with role
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  if (error) throw error;

  // Fetch roles from user_roles table
  const { data: userRolesData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const roles =
    userRolesData?.map((r: { role: string }) => r.role) || (data.role ? [data.role] : []);

  return { ...data, roles };
}

/**
 * Call the admin-users Edge Function (service role key stays server-side).
 * The function rejects callers who are not logged in as admin.
 */
async function invokeAdminUsers<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });

  if (error) {
    // FunctionsHttpError carries the Response; surface the server's message
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === 'function') {
      const payload = await response.json().catch(() => null);
      if (payload?.error) throw new Error(payload.error);
    }
    throw error;
  }

  return data as T;
}

/**
 * Sign up new user (admin only)
 * Email is auto-confirmed by the admin-users Edge Function
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  roleOrRoles: AppRole | AppRole[],
) {
  const roles = Array.from(new Set(Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles]));

  return invokeAdminUsers<{ id: string }>({ action: 'create', email, password, fullName, roles });
}

/**
 * Delete user from auth.users (admin only)
 * Profile will be cascade-deleted by database trigger/policy
 */
export async function deleteAuthUser(userId: string) {
  await invokeAdminUsers({ action: 'delete', userId });
}

/**
 * Update user password directly (admin only)
 * Sets the password without the email reset flow
 */
export async function adminUpdatePassword(userId: string, newPassword: string) {
  await invokeAdminUsers({ action: 'set_password', userId, password: newPassword });
}

/**
 * Update user profile, login email and roles (admin only)
 */
export async function updateUserProfileAdmin(
  userId: string,
  updates: { full_name: string; email: string; roles: string[] },
) {
  return invokeAdminUsers<UserProfile>({
    action: 'update',
    userId,
    fullName: updates.full_name,
    email: updates.email,
    roles: updates.roles,
  });
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'role' | 'avatar_url' | 'email'>>,
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${fileExt}`;

  // Remove old avatar if exists
  const { data: existingFiles } = await supabase.storage.from('avatars').list(userId);

  if (existingFiles && existingFiles.length > 0) {
    const filesToRemove = existingFiles.map((f) => `${userId}/${f.name}`);
    await supabase.storage.from('avatars').remove(filesToRemove);
  }

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  // Update profile with new avatar URL
  await updateUserProfile(userId, { avatar_url: publicUrl });

  return publicUrl;
}

/**
 * Update password (self-service)
 * Includes password strength validation
 */
export async function updatePassword(newPassword: string) {
  // Password validation
  if (newPassword.length < 8) {
    throw new Error('Password minimal 8 karakter');
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new Error('Password harus mengandung huruf besar');
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new Error('Password harus mengandung huruf kecil');
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new Error('Password harus mengandung angka');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

/**
 * Reset password via email
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

/**
 * Helper: Check if a user profile has a specific role
 */
export function hasRole(profile: UserProfile | null, role: string): boolean {
  if (!profile) return false;
  const roles = profile.roles ?? (profile.role ? [profile.role] : []);
  return roles.includes(role);
}

/**
 * Helper: Get roles array from profile with fallback
 */
export function getUserRoles(profile: UserProfile | null): string[] {
  if (!profile) return [];
  return profile.roles ?? (profile.role ? [profile.role] : []);
}
