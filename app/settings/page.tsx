import { Metadata } from 'next';
import SettingsClient from './SettingsClient';

export const metadata: Metadata = {
  title: 'Settings — Cemrosta',
  description: 'Set up your crew profile.',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
