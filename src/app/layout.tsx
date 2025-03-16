import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const inter = { className: '' }; // Remplacer par la fonte Inter si vous l'importez

export const metadata: Metadata = {
  title: 'Forgeo - HubSpot Data Audit Platform',
  description: 'Analyze and optimize your HubSpot data quality',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 