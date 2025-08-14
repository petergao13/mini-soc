import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini SOC Dashboard',
  description: 'Security Operations Center Dashboard for Network Traffic Analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
