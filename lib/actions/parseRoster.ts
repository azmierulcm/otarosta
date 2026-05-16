'use server';

import { getDocumentProxy, extractText } from 'unpdf';
import { parseRosterText } from '@/lib/parser';
import { RosterData, DutyEvent } from '@/lib/types';
import { saveRoster } from '@/lib/actions/rosters';

export interface ParsedRosterResult extends RosterData {
  rosterId: string;
}

/** Remove undefined fields so Firestore doesn't reject the document */
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

export async function parseRoster(formData: FormData): Promise<ParsedRosterResult> {
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;

  if (!file) throw new Error('No file uploaded.');
  if (!userId) throw new Error('You must be signed in to upload a roster.');

  // 1. Extract text from PDF
  let text = '';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const pdf = await getDocumentProxy(buffer);
    const result = await extractText(pdf, { mergePages: true });
    text = result.text ?? '';
  } catch (err: any) {
    console.error('[parseRoster] PDF extraction failed:', err);
    throw new Error(
      'Could not read this PDF. Make sure it is a text-based (not scanned) roster PDF exported from AIMS.'
    );
  }

  if (!text.trim()) {
    throw new Error(
      'This PDF appears to be blank or image-based. Export your roster as a text PDF from AIMS and try again.'
    );
  }

  // 2. Parse roster structure
  let parsed;
  try {
    parsed = parseRosterText(text);
  } catch (err: any) {
    console.error('[parseRoster] Parser failed:', err);
    throw new Error(err.message || 'Could not recognise this roster format.');
  }

  if (!parsed.duties || parsed.duties.length === 0) {
    throw new Error(
      'No duties were found in this roster. Make sure you are uploading a Malaysia Airlines AIMS roster PDF.'
    );
  }

  // 3. Map to DutyEvent[], stripping undefined so Firestore accepts the document
  const events: DutyEvent[] = parsed.duties.map((d) =>
    stripUndefined({
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
    })
  );

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
    console.error('[parseRoster] Firestore save failed:', err);
    throw new Error(
      'Roster was parsed successfully but could not be saved. Please try again.'
    );
  }
}
