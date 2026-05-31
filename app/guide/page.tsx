import type { Metadata } from 'next';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { GuidePage } from '@/components/marketing/GuidePage';

export const metadata: Metadata = {
  title: 'How It Works — Otarosta',
  description:
    'Step-by-step guide to uploading your MAS roster PDF, syncing your calendar, earning city patches, and getting the most out of Otarosta.',
  alternates: { canonical: '/guide' },
  openGraph: {
    title: 'How Otarosta Works — Crew Guide',
    description:
      'From PDF upload to synced calendar, destination passport, and monthly recap. Everything explained step by step.',
    url: 'https://otarosta.com/guide',
  },
};

export default function GuideRoute() {
  return (
    <>
      <Navbar />
      <GuidePage />
      <Footer />
    </>
  );
}
