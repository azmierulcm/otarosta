import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { adminDb } from '@/lib/firebase/admin';

const SUPPORT_EMAIL = 'mainemirul@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userEmail, category, description, rosterMonth, rosterYear } = body;

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description too short.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const reportId  = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // ── 1. Always save to Firestore (never lost even if email fails) ──────────
    await adminDb.collection('bug_reports').doc(reportId).set({
      reportId,
      userId:      userId  ?? 'anonymous',
      userEmail:   userEmail ?? null,
      category:    category ?? 'General',
      description: description.trim(),
      rosterMonth: rosterMonth ?? null,
      rosterYear:  rosterYear  ?? null,
      createdAt:   timestamp,
      status:      'open',
    });

    // ── 2. Send email via Resend ──────────────────────────────────────────────
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from:    'Cemrosta Support <onboarding@resend.dev>',
        to:      SUPPORT_EMAIL,
        subject: `[Cemrosta] Bug Report — ${category ?? 'General'} (${reportId})`,
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #e5484d; margin: 0 0 24px;">🛑 Bug Report — Cemrosta</h2>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold; width: 140px;">Report ID</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${reportId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Category</td>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd;">${category ?? 'General'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold;">User</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${userEmail ?? userId ?? 'Anonymous'}</td>
              </tr>
              ${rosterMonth ? `
              <tr>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Roster Period</td>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd;">${rosterMonth} ${rosterYear ?? ''}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold;">Submitted</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${timestamp}</td>
              </tr>
            </table>

            <div style="margin-top: 24px; padding: 16px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-weight: bold; font-size: 13px;">Description:</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description.trim()}</p>
            </div>

            <p style="margin-top: 24px; font-size: 11px; color: #999;">
              Logged in Firestore under bug_reports/${reportId}
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, reportId });
  } catch (err) {
    console.error('[/api/support]', err);
    return NextResponse.json(
      { error: 'Failed to submit report.' },
      { status: 500 },
    );
  }
}
