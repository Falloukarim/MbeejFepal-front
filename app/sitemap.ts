import { MetadataRoute } from 'next'

export default async function sitemap(): MetadataRoute.Sitemap {
  // Si vos pages sont statiques :
  return [
    {
      url: 'https://mbeejfepal.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    // Ajoutez vos autres pages publiques ici (ex: /about, /contact)
  ]
}
