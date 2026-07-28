import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const baseUrl = 'https://www.physiokbnyon.ch';

const staticPages = [
  { url: '/', changefreq: 'weekly', priority: 1.0 },
  { url: '/services', changefreq: 'monthly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog', changefreq: 'weekly', priority: 0.9 },
];

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog');
  const publishedPosts = posts.filter((post) => !post.data.draft);

  const today = new Date().toISOString().split('T')[0];

  const staticUrls = staticPages
    .map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('');

  const blogUrls = publishedPosts
    .map((post) => {
      const lastmod = post.data.updatedDate
        ? post.data.updatedDate.toISOString().split('T')[0]
        : post.data.publishDate.toISOString().split('T')[0];
      return `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}${blogUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

