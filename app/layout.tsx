import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JD Generator — Transcript to Job Description',
  description: 'Convert recruiter-hiring manager conversation transcripts into polished job descriptions with PDF export, powered by Claude AI.',
  keywords: ['job description', 'AI', 'recruiter', 'hiring', 'PDF', 'Claude'],
  openGraph: {
    title: 'JD Generator',
    description: 'Convert conversation transcripts into polished job descriptions',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
