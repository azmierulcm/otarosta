'use server';

// pdf-parse is CJS-only — require() avoids Turbopack ESM resolution errors
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: Record<string, unknown>
) => Promise<{ text: string; numpages: number }>;
import { parseRosterText } from '@/lib/parser';
import { RosterData, DutyEvent } from '@/lib/types';
import { saveRoster } from '@/lib/actions/rosters';

export interface ParsedRosterResult extends RosterData {
  rosterId: string;
}

export async function parseRoster(formData: FormData): Promise<ParsedRosterResult> {
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;

  if (!file) throw new Error('No file uploaded.');
  if (!userId) throw new Error('You must be signed in to upload a roster.');

  // 1. Extract raw text from PDF
  let text = '';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await pdfParse(buffer);
    text = result.text ?? '';
  } catch (err: any) {
    console.error('[parseRoster] PDF extraction failed:', err);
    throw new Error(
      'Could not read this PDF file. Make sure it is a text-based (not scanned) roster PDF.'
    );
  }

  if (!text.trim()) {
    throw new Error(
      'This PDF appears to be blank or image-based. Export your roster as a text PDF from AIMS and try again.'
    );
  }

  // 2. Parse roster structure from extracted text
  let parsed;
  try {
    parsed = parseRosterText(text);
  } catch (err: any) {
    console.error('[parseRoster] Parser failed:', err);
    // Surface the parser's own message — it's already user-friendly
    throw new Error(err.message || 'Could not recognise this roster format.');
  }

  if (!parsed.duties || parsed.duties.length === 0) {
    throw new Error(
      'No duties were found in this roster. Make sure you are uploading a Malaysia Airlines AIMS roster PDF.'
    );
  }

  // 3. Map parsed duties to DutyEvent[]
  const events: DutyEvent[] = parsed.duties.map((d) => ({
    id: d.id,
    type: d.type as DutyEvent['type'],
    date: d.date,
    flightNumber: d.flight?.flightNumber,
    depPort: d.flight?.depPort,
    arrPort: d.flight?.arrPort,
    std: d.flight?.std,
    sta: d.flight?.sta,
    signOn: d.signOn ?? d.flight?.signOn,
    signOff: d.signOff ?? d.flight?.signOff,
    hotel: d.flight?.hotel,
    description: d.description,
  }));

  const rosterData: RosterData = {
    events,
    month: parsed.month,
    year: parsed.year,
    crewName: parsed.crewName,
  };

  // 4. Save to Firestore
  try {
    const rosterId = await saveRoster(userId, rosterData);
    return { ...rosterData, rosterId };
  } catch (err: any) {
    console.error('[parseRoster] Save failed:', err);
    throw new Error(
      'Roster was parsed successfully but could not be saved. Please try again.'
    );
  }
}
