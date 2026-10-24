import { MetadataRoute } from 'next'

// Ajout de Promise<> autour du type de retour pour corriger l'erreur ts(1064)
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    {
      url: 'https://mbeejfepal.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    // Vos autres pages si nécessaire
  ]
}
