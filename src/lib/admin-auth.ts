/**
 * Authentification HTTP Basic pour l'espace admin.
 * Credentials via variables d'environnement ADMIN_USER / ADMIN_PASSWORD.
 * Protège /admin et /api/admin/* même en cas d'accès direct au port de l'app.
 */

export function checkAdminAuth(request: Request): boolean {
  const user = process.env.ADMIN_USER || 'admin';
  const pass = process.env.ADMIN_PASSWORD || '';

  // Refus par défaut si le mot de passe n'est pas configuré
  if (!pass) return false;

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) return false;

  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep === -1) return false;
    const u = decoded.slice(0, sep);
    const p = decoded.slice(sep + 1);
    return u === user && p === pass;
  } catch {
    return false;
  }
}

export function unauthorizedResponse(): Response {
  return new Response('Authentification requise', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Espace Admin PhysioKB", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
