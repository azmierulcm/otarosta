import { Metadata } from 'next';
import { Suspense } from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings — Otarosta',
  description: 'Set up your crew profile.',
};

export default function SettingsPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Suspense>
          <SettingsClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
