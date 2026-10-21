import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'MCK Beyond Youth Ministries',
  description:
    'Empowering the next generation to live boldly for Christ. Join MCK Beyond Youth for worship, fellowship, growth, and kingdom impact.',
  keywords: ['MCK', 'Beyond', 'Youth Ministry', 'Church', 'Kenya', 'Christian Youth'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased min-h-screen bg-background text-slate-200">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
