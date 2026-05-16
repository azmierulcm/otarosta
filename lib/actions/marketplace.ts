'use server'

// Marketplace actions — rebuilt in the marketplace phase

export async function reportListing(_data: {
  listingId: string
  reporterId: string
  reason: string
  details?: string
}) {
  return { success: true }
}
