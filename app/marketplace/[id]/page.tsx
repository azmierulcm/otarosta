import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getListing } from '@/lib/actions/listings';
import ListingDetailClient from './ListingDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await getListing(id);
    return {
      title: `${listing.title} — Marketplace | Otarosta`,
      description: listing.description.slice(0, 150),
      openGraph: {
        title: listing.title,
        description: listing.description.slice(0, 150),
        images: listing.images[0] ? [listing.images[0]] : [],
      },
    };
  } catch {
    return { title: 'Listing — Marketplace | Otarosta' };
  }
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  let listing;
  try {
    listing = await getListing(id);
  } catch (err) {
    console.error('[ListingDetailPage] getListing failed for id=%s:', id, err);
    notFound();
  }

  return <ListingDetailClient listing={listing!} />;
}
