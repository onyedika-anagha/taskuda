import type { Plugin } from 'vite'

/**
 * Search and AI-crawler files built from the site's address (SEO/AEO). Set `SITE_URL` (or let
 * Vercel's `VERCEL_PROJECT_PRODUCTION_URL` fill it in) for absolute links. Search indexing stays
 * off until `SITE_INDEXING=on`: the security review keeps Taskuda unpromoted until waivers S1 and
 * S3 close, so the switch is explicit.
 */
export interface SeoOptions {
  /** `https://taskuda.example.com`, no trailing slash; `undefined` when unknown. */
  siteUrl: string | undefined
  indexable: boolean
}

/** Pages worth indexing. App screens (settings, report, past days) are private by nature. */
export const PUBLIC_PAGES = ['/', '/about/'] as const

/** AI search bots that cite sources: allowed by name so a later blanket rule can't shut them out. */
export const AI_SEARCH_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'anthropic-ai',
  'Google-Extended',
  'Bingbot',
] as const

const PRIVATE_PATHS = ['/api/', '/settings', '/report', '/day/', '/welcome']

export function resolveSeoOptions(env: Record<string, string | undefined>): SeoOptions {
  const raw =
    env.SITE_URL ?? (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  const siteUrl = raw.trim().replace(/\/+$/, '') || undefined
  return { siteUrl, indexable: env.SITE_INDEXING === 'on' && siteUrl !== undefined }
}

export function robotsTxt({ siteUrl, indexable }: SeoOptions): string {
  if (!indexable) return 'User-agent: *\nDisallow: /\n'
  const privateRules = PRIVATE_PATHS.map((path) => `Disallow: ${path}`).join('\n')
  const bots = AI_SEARCH_BOTS.map((bot) => `User-agent: ${bot}\nAllow: /\n${privateRules}`).join('\n\n')
  return `User-agent: *\nAllow: /\n${privateRules}\n\n${bots}\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}

export function sitemapXml({ siteUrl }: SeoOptions, lastModified: string): string | null {
  if (!siteUrl) return null
  const urls = PUBLIC_PAGES.map(
    (page) => `  <url>\n    <loc>${siteUrl}${page}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`,
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** Head tags that depend on the address: canonical, social card URLs and the robots meta. */
export function seoHead({ siteUrl, indexable }: SeoOptions, page: (typeof PUBLIC_PAGES)[number]): string {
  const tags = [`<meta name="robots" content="${indexable ? 'index, follow' : 'noindex, nofollow'}" />`]
  if (siteUrl) {
    tags.push(
      `<link rel="canonical" href="${siteUrl}${page}" />`,
      `<meta property="og:url" content="${siteUrl}${page}" />`,
      `<meta property="og:image" content="${siteUrl}/og-image.png" />`,
      `<meta name="twitter:image" content="${siteUrl}/og-image.png" />`,
    )
  }
  return tags.join('\n    ')
}

/** Replaces `<!-- seo:head -->` and `%SITE_URL%` in the HTML pages, and emits the crawler files. */
export function seoPlugin(options: SeoOptions, lastModified: string): Plugin {
  return {
    name: 'taskuda-seo',
    transformIndexHtml(html, context) {
      const page = /about[\\/]index\.html$/.test(context.filename) ? '/about/' : '/'
      return html
        .replace('<!-- seo:head -->', seoHead(options, page))
        .replaceAll('%SITE_URL%', options.siteUrl ?? '')
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(options) })
      const sitemap = sitemapXml(options, lastModified)
      if (sitemap) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
    },
  }
}
