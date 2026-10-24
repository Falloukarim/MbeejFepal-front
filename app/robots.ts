import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/', // Bloque l'exploration de vos routes API si vous en avez
    },
    sitemap: 'https://mbeejfepal.com',
  }
}
