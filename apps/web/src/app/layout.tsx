import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AR-Core | منصة الواقع المعزز',
  description: 'منصة الواقع المعزز كخدمة للشركات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
