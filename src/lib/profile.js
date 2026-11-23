import { supabase } from './supabase';

export const USERNAME_COOLDOWN_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

// ---------- password rules: 8-16 characters, at least one number ----------
export function passwordChecks(password) {
  return [
    { id: 'len', label: '8 to 16 characters', ok: password.length >= 8 && password.length <= 16 },
    { id: 'num', label: 'At least one number', ok: /\d/.test(password) },
  ];
}
export const isPasswordValid = (password) => passwordChecks(password).every((c) => c.ok);

// ---------- username rules ----------
export function usernameError(value) {
  const name = value.trim();
  if (name.length < 3) return 'Username must be at least 3 characters.';
  if (name.length > 20) return 'Username can be at most 20 characters.';
  if (!/^[A-Za-z0-9_.]+$/.test(name)) return 'Use only letters, numbers, dots and underscores.';
  return '';
}

// ---------- birthday (mm/dd/yyyy) ----------
// Adds the slashes while the player types: 01152004 -> 01/15/2004
export function maskBirthday(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Returns { iso: 'yyyy-mm-dd', age } or null when the date is not real / in the future.
export function parseBirthday(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  const month = Number(mm);
  const day = Number(dd);
  const year = Number(yyyy);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (date > new Date() || year < 1900) return null;
  return { iso: `${yyyy}-${mm}-${dd}`, age: calcAge(`${yyyy}-${mm}-${dd}`) };
}

export function calcAge(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

export function formatBirthday(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
}

// ---------- username change cooldown ----------
// The time of the last change is kept in the account's own metadata (user_metadata),
// so no database column is needed.
export function usernameCooldown(user) {
  const last = user?.user_metadata?.username_changed_at;
  if (!last) return { locked: false, until: null };
  const until = new Date(new Date(last).getTime() + USERNAME_COOLDOWN_DAYS * DAY_MS);
  return { locked: until > new Date(), until };
}

// ---------- profile sync ----------
// Sign-up stores first name, last name and birthday in the account metadata.
// This copies them into the existing "profiles" row if those columns are still empty.
// It never overwrites anything that is already filled in.
export async function syncProfileFromMetadata(user) {
  try {
    const meta = user?.user_metadata || {};
    if (!meta.first_name && !meta.last_name && !meta.birthday && !meta.username) return;

    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name, birthday, username')
      .eq('id', user.id)
      .maybeSingle();
    if (!data) return;

    const patch = {};
    if (!data.first_name && meta.first_name) patch.first_name = meta.first_name;
    if (!data.last_name && meta.last_name) patch.last_name = meta.last_name;
    if (!data.birthday && meta.birthday) patch.birthday = meta.birthday;
    if (!data.username && meta.username) patch.username = meta.username;

    if (Object.keys(patch).length) {
      await supabase.from('profiles').update(patch).eq('id', user.id);
    }
  } catch (error) {
    console.warn('[KORRECT] profile sync skipped:', error?.message || error);
  }
}

// ---------- optional: tell "no account" apart from "wrong password" ----------
// Supabase answers both with the same "Invalid login credentials" error on purpose.
// If you ever add a database function named  email_exists(p_email text) returning boolean,
// the login page will use it automatically. Until then this returns null ("unknown").
export async function accountExists(email) {
  try {
    const { data, error } = await supabase.rpc('email_exists', { p_email: email });
    if (error || typeof data !== 'boolean') return null;
    return data;
  } catch {
    return null;
  }
}
