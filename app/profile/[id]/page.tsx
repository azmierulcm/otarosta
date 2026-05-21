import type { Metadata } from 'next';
import PublicProfileClient from './PublicProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Crew Passport — Otarosta`,
    description: `View this crew member's flight passport — destinations collected, sectors flown, and career stats.`,
    alternates: { canonical: `/profile/${id}` },
    openGraph: {
      title: 'Crew Passport — Otarosta',
      description: 'Crew flight passport built with Otarosta.',
      images: ['/api/og/profile'],
      url: `https://otarosta.com/profile/${id}`,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  return <PublicProfileClient id={id} />;
}
