/**
 * Client API Umami (analytics auto-hébergé) pour l'espace admin.
 *
 * L'app Astro et Umami partagent le même réseau Docker (physio-network) :
 * l'API est appelée directement via http://umami:3000 (pas de passage par nginx).
 *
 * Variables d'environnement :
 *   UMAMI_API_URL  – défaut http://umami:3000
 *   UMAMI_USER     – défaut "admin"
 *   UMAMI_PASSWORD – défaut "admin" (mot de passe initial Umami)
 *
 * Le token JWT est mis en cache en mémoire (durée de vie du process).
 * Toutes les fonctions échouent en douceur (null) pour ne jamais casser /admin.
 */

const UMAMI_API_URL = process.env.UMAMI_API_URL || 'http://umami:3000';
const UMAMI_USER = process.env.UMAMI_USER || 'admin';
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD || 'admin';

export interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number; // secondes cumulées
}

export interface UmamiPageMetric {
  url: string;
  views: number;
}

export interface UmamiDashboard {
  websiteId: string;
  websiteName: string;
  stats30d: UmamiStats;
  topPages: UmamiPageMetric[];
}

let cachedToken: string | null = null;

async function login(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    const res = await fetch(`${UMAMI_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: UMAMI_USER, password: UMAMI_PASSWORD }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = data.token || null;
    return cachedToken;
  } catch {
    return null;
  }
}

async function apiGet(path: string): Promise<any | null> {
  const token = await login();
  if (!token) return null;
  try {
    const res = await fetch(`${UMAMI_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 401) {
      cachedToken = null; // token expiré → prochain appel relogguera
      return null;
    }
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function apiPost(path: string, body: unknown): Promise<any | null> {
  const token = await login();
  if (!token) return null;
  try {
    const res = await fetch(`${UMAMI_API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Récupère le premier site Umami, ou le crée si aucun n'existe. */
export async function getOrCreateWebsite(): Promise<{ id: string; name: string } | null> {
  const list = await apiGet('/api/websites');
  // Umami v2.9+ : { data: [...] } ; versions antérieures : tableau direct
  const websites: any[] = Array.isArray(list) ? list : list?.data || [];
  if (websites.length > 0) {
    return { id: websites[0].id, name: websites[0].name || websites[0].domain };
  }
  // Aucun site → création automatique
  const created = await apiPost('/api/websites', {
    name: 'physiokbnyon.ch',
    domain: 'physiokbnyon.ch',
  });
  if (created?.id) return { id: created.id, name: created.name };
  return null;
}

function num(v: any): number {
  if (typeof v === 'number') return v;
  if (v && typeof v.value === 'number') return v.value;
  return 0;
}

/** Récupère les stats des 30 derniers jours + top pages pour /admin. */
export async function getUmamiDashboard(): Promise<UmamiDashboard | null> {
  const website = await getOrCreateWebsite();
  if (!website) return null;

  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000;

  const raw = await apiGet(`/api/websites/${website.id}/stats?startAt=${startAt}&endAt=${endAt}`);
  if (!raw) return null;

  const metricsRaw = await apiGet(
    `/api/websites/${website.id}/metrics?startAt=${startAt}&endAt=${endAt}&type=url`
  );
  const metrics: any[] = Array.isArray(metricsRaw) ? metricsRaw : metricsRaw?.data || [];
  const topPages: UmamiPageMetric[] = metrics
    .map((m) => ({ url: String(m.x ?? m.url ?? ''), views: Number(m.y ?? m.value ?? 0) }))
    .filter((m) => m.url)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    websiteId: website.id,
    websiteName: website.name,
    stats30d: {
      pageviews: num(raw.pageviews),
      visitors: num(raw.visitors),
      visits: num(raw.visits),
      bounces: num(raw.bounces),
      totaltime: num(raw.totaltime),
    },
    topPages,
  };
}
