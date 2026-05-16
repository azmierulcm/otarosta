export type ListingCategory =
  | 'headsets'
  | 'luggage'
  | 'watches'
  | 'uniforms'
  | 'manuals'
  | 'other';

export type ListingCondition =
  | 'new'
  | 'like-new'
  | 'good'
  | 'fair'
  | 'for-parts';

export type ListingStatus = 'active' | 'expired' | 'hidden' | 'sold';

export type ContactPref = 'whatsapp' | 'email';

export interface Listing {
  id: string;
  userId: string;

  // Seller snapshot (denormalised at listing-creation time)
  sellerName: string;
  sellerVerified: boolean;   // true if user had ≥1 parsed roster at time of listing
  sellerBase: string;        // 'KUL', 'SZB', etc.
  sellerMemberSince: string; // ISO date string

  // Item
  title: string;
  category: ListingCategory;
  condition: ListingCondition;
  price: number;             // RM, integer
  description: string;
  images: string[];          // Firebase Storage download URLs (max 5)

  // Contact
  contactPref: ContactPref;
  contactValue: string;      // phone digits or email address

  // Lifecycle
  status: ListingStatus;
  reportCount: number;
  reportedBy: string[];      // userId set — prevents duplicate reports

  createdAt: string;         // ISO string (serialised from Firestore Timestamp)
  expiresAt: string;         // ISO string — 30 days after createdAt / renewedAt
  renewedAt: string | null;  // ISO string or null
  updatedAt: string;         // ISO string
}

export type ListingInput = Pick<
  Listing,
  | 'title'
  | 'category'
  | 'condition'
  | 'price'
  | 'description'
  | 'images'
  | 'contactPref'
  | 'contactValue'
>;

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  headsets: 'Headsets',
  luggage: 'Luggage',
  watches: 'Watches',
  uniforms: 'Uniforms',
  manuals: 'Manuals',
  other: 'Other',
};

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  'new': 'New',
  'like-new': 'Like New',
  'good': 'Good',
  'fair': 'Fair',
  'for-parts': 'For Parts',
};

export const LISTING_EXPIRY_DAYS = 30;
export const MAX_ACTIVE_LISTINGS = 5;
export const AUTO_HIDE_REPORT_THRESHOLD = 3;
