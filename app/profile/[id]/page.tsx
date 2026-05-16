import type { Metadata } from 'next';
import PublicProfileClient from './PublicProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Crew Passport — Cemrosta`,
    description: `View this Malaysia Airlines crew member's flight passport — destinations collected, sectors flown, and career stats.`,
    alternates: { canonical: `/profile/${id}` },
    openGraph: {
      title: 'Crew Passport — Cemrosta',
      description: 'Malaysia Airlines crew flight passport built with Cemrosta.',
      images: ['/api/og/profile'],
      url: `https://cemrosta.vercel.app/profile/${id}`,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  return <PublicProfileClient id={id} />;
}
