'use server';

import { getDocumentProxy, extractText } from 'unpdf';
import { parseRosterText } from '@/lib/parser';
import { RosterData, DutyEvent } from '@/lib/types';
import { saveRoster } from '@/lib/actions/rosters';

export interface ParsedRosterResult extends RosterData {
  rosterId: string;
}

export async function parseRoster(formData: FormData): Promise<ParsedRosterResult> {
  const file = formData.get('file') as File;
  const userId = formData.get('userId') as string;

  if (!file) throw new Error('No file uploaded');
  if (!userId) throw new Error('You must be signed in to upload a roster.');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  try {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });

    const parsed = parseRosterText(text);

    const events: DutyEvent[] = parsed.duties.map((d) => ({
      id: d.id,
      type: d.type as any,
      date: d.date,
      flightNumber: d.flight?.flightNumber,
      depPort: d.flight?.depPort,
      arrPort: d.flight?.arrPort,
      std: d.flight?.std,
      sta: d.flight?.sta,
      signOn: d.signOn || d.flight?.signOn,
      signOff: d.signOff || d.flight?.signOff,
      hotel: d.flight?.hotel,
      description: d.description,
    }));

    const rosterData: RosterData = {
      events,
      month: parsed.month,
      year: parsed.year,
      crewName: parsed.crewName,
    };

    const rosterId = await saveRoster(userId, rosterData);

    return { ...rosterData, rosterId };
  } catch (err: any) {
    console.error('PDF Parse Error:', err);
    throw new Error(err.message || 'Could not read PDF roster.');
  }
}
