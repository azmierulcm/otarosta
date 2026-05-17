import { Metadata } from 'next';
import { Suspense } from 'react';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings — Cemrosta',
  description: 'Set up your crew profile.',
};

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsClient />
    </Suspense>
  );
}
