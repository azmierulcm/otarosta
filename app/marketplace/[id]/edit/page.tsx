'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getListing, updateListing } from '@/lib/actions/listings';
import { ListingForm } from '@/components/product/marketplace/ListingForm';
import type { Listing, ListingInput } from '@/lib/types/marketplace';

export default function EditListingPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function uploadImage(file: File): Promise<string> {
    if (!user) throw new Error('Not signed in');
    const token = await user.getIdToken();
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/listings/images', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Image upload failed');
    return json.url as string;
  }
  const params = useParams<{ id: string }>();
  const listingId = params.id;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getListing(listingId)
      .then(setListing)
      .catch(() => setError('Listing not found'))
      .finally(() => setLoading(false));
  }, [listingId]);

  async function handleSubmit(data: ListingInput) {
    if (!user) return;
    setError('');
    try {
      await updateListing(listingId, user.uid, data);
      router.push(`/marketplace/${listingId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update listing');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link
        href={`/marketplace/${listingId}`}
        className="inline-flex items-center gap-1 text-[13px] text-text-muted hover:text-text transition-colors"
      >
        <ChevronLeft size={16} />
        Back to listing
      </Link>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-subtle font-mono mb-2">
          {"// EDIT LISTING"}
        </p>
        <h1 className="text-3xl font-black tracking-tighter text-text">Update your listing</h1>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/30 text-[13px] text-destructive">
          {error}
        </div>
      )}

      {listing && (
        <ListingForm
          initial={{
            title: listing.title,
            category: listing.category,
            condition: listing.condition,
            price: listing.price,
            description: listing.description,
            images: listing.images,
            contactPref: listing.contactPref,
            contactValue: listing.contactValue,
          }}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          uploadImage={uploadImage}
        />
      )}
    </div>
  );
}
