import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const baseUrl = 'https://otarosta.com';

  return {
    rules: {
      userAgent: '*',
      allow: isProduction ? '/' : [],
      disallow: isProduction ? [] : '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
