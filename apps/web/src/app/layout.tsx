import type { Metadata } from 'next';
import { StellarProvider } from '@/context/StellarContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'PayMint - AI Agent Payment Platform',
  description: 'x402-Powered Agent Services Marketplace on Stellar',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen" style={{ background: '#000000', color: '#ffffff' }}>
        <StellarProvider>
          <main style={{ minHeight: '100vh' }}>
            {children}
          </main>
        </StellarProvider>
      </body>
    </html>
  );
}