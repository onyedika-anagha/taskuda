import { describe, expect, it } from 'vitest'
import { AI_SEARCH_BOTS, resolveSeoOptions, robotsTxt, seoHead, sitemapXml } from './seoPlugin.ts'

const SITE = 'https://taskuda.example.com'

describe('seoPlugin', () => {
  it('takes SITE_URL first, then Vercel’s production URL, without a trailing slash', () => {
    expect(resolveSeoOptions({ SITE_URL: `${SITE}/` }).siteUrl).toBe(SITE)
    expect(resolveSeoOptions({ VERCEL_PROJECT_PRODUCTION_URL: 'taskuda.vercel.app' }).siteUrl).toBe(
      'https://taskuda.vercel.app',
    )
    expect(resolveSeoOptions({}).siteUrl).toBeUndefined()
  })

  it('keeps indexing off unless SITE_INDEXING=on and the address is known', () => {
    expect(resolveSeoOptions({ SITE_URL: SITE }).indexable).toBe(false)
    expect(resolveSeoOptions({ SITE_INDEXING: 'on' }).indexable).toBe(false)
    expect(resolveSeoOptions({ SITE_URL: SITE, SITE_INDEXING: 'on' }).indexable).toBe(true)
  })

  it('blocks every crawler while indexing is off', () => {
    expect(robotsTxt({ siteUrl: SITE, indexable: false })).toBe('User-agent: *\nDisallow: /\n')
    expect(seoHead({ siteUrl: SITE, indexable: false }, '/')).toContain('noindex, nofollow')
  })

  it('when on, allows AI search bots by name, keeps app screens out and links the sitemap', () => {
    const robots = robotsTxt({ siteUrl: SITE, indexable: true })
    for (const bot of AI_SEARCH_BOTS) expect(robots).toContain(`User-agent: ${bot}\nAllow: /`)
    expect(robots).toContain('Disallow: /settings')
    expect(robots).toContain('Disallow: /api/')
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`)
    expect(robots).not.toContain('Disallow: /\n')
  })

  it('lists the public pages in the sitemap, and needs the address for it', () => {
    const sitemap = sitemapXml({ siteUrl: SITE, indexable: true }, '2026-10-22')
    expect(sitemap).toContain(`<loc>${SITE}/</loc>`)
    expect(sitemap).toContain(`<loc>${SITE}/about/</loc>`)
    expect(sitemap).toContain('<lastmod>2026-10-22</lastmod>')
    expect(sitemapXml({ siteUrl: undefined, indexable: false }, '2026-10-22')).toBeNull()
  })

  it('writes the canonical and social image URLs for each page', () => {
    const head = seoHead({ siteUrl: SITE, indexable: true }, '/about/')
    expect(head).toContain(`<link rel="canonical" href="${SITE}/about/" />`)
    expect(head).toContain(`<meta property="og:image" content="${SITE}/og-image.png" />`)
    expect(head).toContain('index, follow')
  })
})
