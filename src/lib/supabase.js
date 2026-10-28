import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const cloudEnabled = Boolean(url && key);
export const supabase = cloudEnabled
  ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  : null;

export function displayCloudError(error) {
  if (!navigator.onLine) return 'Sin conexión. Revisa internet e intenta de nuevo; el cambio no se guardó.';
  if (error?.code === '23505') return 'Este registro ya existe. Actualiza la lista e intenta de nuevo.';
  if (error?.code === '42501') return 'No se pudo acceder a los pedidos. Revisa la configuración de Supabase.';
  return error?.message || 'No se pudo completar la operación. Intenta de nuevo.';
}

export async function requireData(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
