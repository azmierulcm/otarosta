'use client';

import React, { useState, useRef } from 'react';
import { Loader2, Upload, X, ImagePlus, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { ListingInput, ListingCategory, ListingCondition, ContactPref } from '@/lib/types/marketplace';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/lib/types/marketplace';

interface ListingFormProps {
  initial?: Partial<ListingInput>;
  onSubmit: (data: ListingInput) => Promise<void>;
  submitLabel?: string;
  /** Called with each selected File; must resolve to the Firebase Storage URL. */
  uploadImage: (file: File) => Promise<string>;
}

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [ListingCategory, string][];
const CONDITIONS = Object.entries(CONDITION_LABELS) as [ListingCondition, string][];

function Field({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide"
      >
        {label}
      </label>
      {children}
      {error && <p role="alert" className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-border bg-bg text-[14px] text-text placeholder:text-text-subtle focus:outline-none focus-visible:border-accent/50 focus-visible:ring-1 focus-visible:ring-accent/20 transition-colors';

export function ListingForm({ initial = {}, onSubmit, submitLabel = 'Post Listing', uploadImage }: ListingFormProps) {
  const [title, setTitle] = useState(initial.title ?? '');
  const [category, setCategory] = useState<ListingCategory>(initial.category ?? 'other');
  const [condition, setCondition] = useState<ListingCondition>(initial.condition ?? 'good');
  const [price, setPrice] = useState(initial.price?.toString() ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [contactPref, setContactPref] = useState<ContactPref>(initial.contactPref ?? 'whatsapp');
  const [contactValue, setContactValue] = useState(initial.contactValue ?? '');
  const [images, setImages] = useState<string[]>(initial.images ?? []);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [imageError, setImageError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Title is required';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = 'Enter a valid price in RM';
    if (!description.trim()) e.description = 'Description is required';
    if (!contactValue.trim()) e.contactValue = `${contactPref === 'whatsapp' ? 'Phone number' : 'Email'} is required`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        condition,
        price: Math.round(Number(price)),
        description: description.trim(),
        images,
        contactPref,
        contactValue: contactValue.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Upload images to Firebase Storage via API; store the returned download URLs.
  function handleImageFiles(files: FileList | null) {
    if (!files) return;
    setImageError('');
    const remaining = 5 - images.length - uploadingCount;
    const toAdd = Array.from(files).slice(0, remaining);
    if (toAdd.length === 0) return;

    setUploadingCount((n) => n + toAdd.length);

    toAdd.forEach(async (file) => {
      try {
        const url = await uploadImage(file);
        setImages((prev) => (prev.length < 5 ? [...prev, url] : prev));
      } catch (err) {
        setImageError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setUploadingCount((n) => Math.max(0, n - 1));
      }
    });
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Images */}
      <div className="space-y-1.5">
        <span className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide">
          Photos (up to 5)
        </span>
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-[var(--radius-md)] overflow-hidden border border-border group">
              <Image src={src} alt={`Listing photo ${i + 1}`} fill className="object-cover" sizes="80px" unoptimized />
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              >
                <X size={11} aria-hidden="true" />
              </button>
            </div>
          ))}
          {/* Uploading placeholders */}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div key={`uploading-${i}`} className="w-20 h-20 rounded-[var(--radius-md)] border border-border bg-surface flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-text-subtle" aria-hidden="true" />
            </div>
          ))}
          {/* Add button */}
          {images.length + uploadingCount < 5 && (
            <button
              type="button"
              aria-label="Add listing photo"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingCount > 0}
              className="w-20 h-20 rounded-[var(--radius-md)] border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-text-subtle hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-50"
            >
              <ImagePlus size={20} aria-hidden="true" />
              <span className="text-[10px] font-semibold">Add</span>
            </button>
          )}
        </div>
        {imageError && (
          <p role="alert" className="flex items-center gap-1 text-[11px] text-danger">
            <AlertCircle size={11} aria-hidden="true" />
            {imageError}
          </p>
        )}
        <input
          ref={fileRef}
          id="listing-image-upload"
          type="file"
          accept="image/*"
          multiple
          aria-label="Upload listing photos"
          className="hidden"
          onChange={(e) => { handleImageFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Title */}
      <Field label="Title" htmlFor="listing-title" error={errors.title}>
        <input
          id="listing-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Bose A20 Aviation Headset"
          maxLength={120}
          className={INPUT_CLASS}
        />
      </Field>

      {/* Category */}
      <fieldset className="space-y-1.5">
        <legend className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide">Category</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              aria-pressed={category === val}
              onClick={() => setCategory(val)}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-semibold border transition-colors ${
                category === val
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-bg text-text-muted border-border hover:border-accent/40'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Condition */}
      <fieldset className="space-y-1.5">
        <legend className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide">Condition</legend>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              aria-pressed={condition === val}
              onClick={() => setCondition(val)}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-semibold border transition-colors ${
                condition === val
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-bg text-text-muted border-border hover:border-accent/40'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Price */}
      <Field label="Price (RM)" htmlFor="listing-price" error={errors.price}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-text-muted font-semibold" aria-hidden="true">RM</span>
          <input
            id="listing-price"
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className={`${INPUT_CLASS} pl-10`}
          />
        </div>
      </Field>

      {/* Description */}
      <Field label="Description" htmlFor="listing-description" error={errors.description}>
        <textarea
          id="listing-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the item — condition details, included accessories, reason for selling..."
          rows={4}
          maxLength={1500}
          aria-describedby="listing-desc-count"
          className={`${INPUT_CLASS} resize-none`}
        />
        <p id="listing-desc-count" className="text-[11px] text-text-subtle text-right">{description.length}/1500</p>
      </Field>

      {/* Contact preference */}
      <fieldset className="space-y-2">
        <legend className="block text-[12px] font-semibold text-text-muted uppercase tracking-wide">Contact via</legend>
        <div className="flex gap-2">
          {(['whatsapp', 'email'] as ContactPref[]).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={contactPref === p}
              onClick={() => setContactPref(p)}
              className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-semibold border transition-colors capitalize ${
                contactPref === p
                  ? 'bg-accent text-accent-fg border-accent'
                  : 'bg-bg text-text-muted border-border hover:border-accent/40'
              }`}
            >
              {p === 'whatsapp' ? 'WhatsApp' : 'Email'}
            </button>
          ))}
        </div>
        {errors.contactValue && (
          <p role="alert" className="text-[11px] text-danger">{errors.contactValue}</p>
        )}
        <label htmlFor="listing-contact" className="sr-only">
          {contactPref === 'whatsapp' ? 'WhatsApp phone number' : 'Email address'}
        </label>
        <input
          id="listing-contact"
          type={contactPref === 'email' ? 'email' : 'tel'}
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
          placeholder={contactPref === 'whatsapp' ? '+601X-XXXXXXX' : 'you@example.com'}
          autoComplete={contactPref === 'email' ? 'email' : 'tel'}
          className={INPUT_CLASS}
        />
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || uploadingCount > 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[14px] font-semibold hover:bg-accent-hover disabled:opacity-60 transition-colors shadow-[var(--shadow-sm)]"
      >
        {submitting
          ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          : uploadingCount > 0
          ? <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          : <Upload size={16} aria-hidden="true" />}
        {submitting ? 'Posting…' : uploadingCount > 0 ? 'Uploading photos…' : submitLabel}
      </button>
    </form>
  );
}
