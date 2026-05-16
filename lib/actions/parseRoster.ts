'use server';

import { getDocumentProxy, extractText } from 'unpdf';
import { parseRosterText } from '@/lib/parser';
import type { RosterData, DutyEvent } from '@/lib/types';
import { saveRoster } from '@/lib/actions/rosters';

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function parseRosterPreview(formData: FormData): Promise<RosterData> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file uploaded.');

  let text = '';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const pdf = await getDocumentProxy(buffer);
    const result = await extractText(pdf, { mergePages: true });
    text = result.text ?? '';
  } catch (err: any) {
    console.error('[parseRosterPreview] PDF extraction failed:', err);
    throw new Error('Could not read this PDF. Make sure it is a text-based roster exported from AIMS.');
  }

  if (!text.trim()) {
    throw new Error('This PDF appears to be blank or image-based. Export your roster as a text PDF from AIMS.');
  }

  let parsed;
  try {
    parsed = parseRosterText(text);
  } catch (err: any) {
    console.error('[parseRosterPreview] Parser failed:', err);
    throw new Error(err.message || 'Could not recognise this roster format.');
  }

  if (!parsed.duties || parsed.duties.length === 0) {
    throw new Error('No duties were found. Make sure this is a Malaysia Airlines AIMS roster PDF.');
  }

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

  return { events, month: parsed.month, year: parsed.year, crewName: parsed.crewName };
}

export interface SaveResult {
  rosterId: string;
  icsContent: string;
}

export async function saveConfirmedRoster(userId: string, previewData: RosterData): Promise<SaveResult> {
  if (!userId) throw new Error('You must be signed in to save a roster.');
  try {
    const { generateICS } = await import('@/lib/utils/ics');
    const icsContent = generateICS(
      previewData.events,
      previewData.crewName ?? 'Crew Member',
      previewData.month,
      previewData.year,
    );
    const rosterId = await saveRoster(userId, previewData, icsContent);
    return { rosterId, icsContent };
  } catch (err: any) {
    console.error('[saveConfirmedRoster] failed:', err);
    throw new Error(err.message || 'Could not save roster. Please try again.');
  }
}
