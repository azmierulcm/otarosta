import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import { adminDb, adminBucket } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const SUPPORT_EMAIL = 'mainemirul@gmail.com';
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX      = 3;               // max 3 submissions per window per IP

/** Escape HTML special characters to prevent injection in email bodies. */
function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    // Single-field query only — avoids needing a composite Firestore index.
    // Timestamp filtering is done in-memory on the small result set.
    const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
    const snap = await adminDb
      .collection('bug_reports')
      .where('ip', '==', ip)
      .orderBy('createdAtTs', 'desc')
      .limit(RATE_LIMIT_MAX)
      .get();
    const recent = snap.docs.filter(
      (d) => (d.data().createdAtTs as Timestamp)?.toMillis() >= windowStart,
    );
    return recent.length < RATE_LIMIT_MAX;
  } catch {
    // If the rate-limit check fails for any reason (missing index, cold start),
    // allow the request through — submissions must never be silently dropped.
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 });
    }

    // Accept both JSON and multipart/form-data (when a PDF is attached)
    const contentType = req.headers.get('content-type') ?? '';
    let userId: string | undefined, userEmail: string | undefined,
        category: string | undefined, description: string | undefined,
        rosterMonth: string | undefined, rosterYear: string | undefined;
    let attachedFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const fd = await req.formData();
      userId      = fd.get('userId')      as string ?? undefined;
      userEmail   = fd.get('userEmail')   as string ?? undefined;
      category    = fd.get('category')    as string ?? undefined;
      description = fd.get('description') as string ?? undefined;
      rosterMonth = fd.get('rosterMonth') as string ?? undefined;
      rosterYear  = fd.get('rosterYear')  as string ?? undefined;
      attachedFile = fd.get('file') as File | null;
    } else {
      const body = await req.json();
      ({ userId, userEmail, category, description, rosterMonth, rosterYear } = body);
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: 'Description too short.' }, { status: 400 });
    }

    // Sanitise all user-supplied strings that appear in HTML email
    const safeDescription  = escHtml(String(description).trim());
    const safeCategory     = escHtml(String(category ?? 'General'));
    const safeUserEmail    = escHtml(String(userEmail ?? ''));
    const safeUserId       = escHtml(String(userId ?? 'anonymous'));
    const safeRosterMonth  = rosterMonth ? escHtml(String(rosterMonth)) : null;
    const safeRosterYear   = rosterYear  ? escHtml(String(rosterYear))  : null;

    const timestamp = new Date().toISOString();
    const reportId  = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // ── 1b. Upload attachment to Firebase Storage (if present) ───────────────
    let attachmentUrl: string | null = null;
    if (attachedFile && attachedFile.size > 0) {
      try {
        const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
        if (attachedFile.size > MAX_BYTES) {
          return NextResponse.json({ error: 'Attached file is too large (max 15 MB).' }, { status: 400 });
        }
        const buffer    = Buffer.from(await attachedFile.arrayBuffer());
        const safeName  = attachedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath  = `support-attachments/${reportId}/${safeName}`;
        const fileRef   = adminBucket.file(filePath);
        const dlToken   = randomUUID();
        await fileRef.save(buffer, {
          metadata: {
            contentType: attachedFile.type || 'application/pdf',
            metadata: { firebaseStorageDownloadTokens: dlToken },
          },
        });
        const bucket   = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? adminBucket.name;
        attachmentUrl  = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(filePath)}?alt=media&token=${dlToken}`;
      } catch (uploadErr) {
        // File upload failure must not block the report being saved
        console.error('[/api/support] Attachment upload failed:', uploadErr);
      }
    }

    // ── 1. Always save to Firestore (never lost even if email fails) ──────────
    await adminDb.collection('bug_reports').doc(reportId).set({
      reportId,
      userId:      userId  ?? 'anonymous',
      userEmail:   userEmail ?? null,
      category:    category ?? 'General',
      description: description.trim(),
      rosterMonth: rosterMonth ?? null,
      rosterYear:  rosterYear  ?? null,
      createdAt:     timestamp,
      createdAtTs:   Timestamp.now(),
      ip,
      status:        'open',
      attachmentUrl: attachmentUrl ?? null,
    });

    // ── 2. Send email via Resend ──────────────────────────────────────────────
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from:    'Otarosta Support <support@otarosta.com>',
        to:      SUPPORT_EMAIL,
        subject: `[Otarosta] Bug Report — ${safeCategory} (${reportId})`,
        html: `
          <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
            <h2 style="color: #e5484d; margin: 0 0 24px;">&#x1F6D1; Bug Report — Otarosta</h2>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold; width: 140px;">Report ID</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${reportId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Category</td>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd;">${safeCategory}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold;">User</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${safeUserEmail || safeUserId}</td>
              </tr>
              ${safeRosterMonth ? `
              <tr>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd; font-weight: bold;">Roster Period</td>
                <td style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #ddd;">${safeRosterMonth} ${safeRosterYear ?? ''}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd; font-weight: bold;">Submitted</td>
                <td style="padding: 8px 12px; background: #fff; border: 1px solid #ddd;">${timestamp}</td>
              </tr>
            </table>

            <div style="margin-top: 24px; padding: 16px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
              <p style="margin: 0 0 8px; font-weight: bold; font-size: 13px;">Description:</p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeDescription}</p>
            </div>

            ${attachmentUrl ? `
            <div style="margin-top: 16px; padding: 12px 16px; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
              <p style="margin: 0 0 6px; font-weight: bold; font-size: 12px;">📎 Attachment:</p>
              <a href="${attachmentUrl}" style="font-size: 12px; color: #0070f3; word-break: break-all;">${attachmentUrl}</a>
            </div>` : ''}

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
