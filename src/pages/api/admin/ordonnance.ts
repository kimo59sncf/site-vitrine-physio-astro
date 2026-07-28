import type { APIRoute } from 'astro';
import fs from 'fs';
import path from 'path';
import { checkAdminAuth, unauthorizedResponse } from '../../../lib/admin-auth';

// Sert une ordonnance uploadee - acces reserve a l'admin (donnees de sante)
export const GET: APIRoute = async ({ request }) => {
  if (!checkAdminAuth(request)) {
    return unauthorizedResponse();
  }

  const url = new URL(request.url);
  const file = url.searchParams.get('f') || '';

  // Anti path traversal : nom de fichier strict
  if (!/^[a-zA-Z0-9._-]+$/.test(file)) {
    return new Response(JSON.stringify({ error: 'Invalid filename' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  const filePath = path.join(DATA_DIR, 'uploads', file);

  if (!fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ext = path.extname(file).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const buffer = fs.readFileSync(filePath);
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${file}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
};
