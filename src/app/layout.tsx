import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import Navbar from '../components/Navbar';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'EcoTrack AI - Understand Your Impact. Save the Planet.',
  description: 'Track your carbon emissions, receive Gemini AI sustainability coaching, complete green challenges, and offset your carbon footprint.',
  keywords: 'sustainability, carbon footprint calculator, climate change, green tracker, eco coach, carbon offset',
  openGraph: {
    title: 'EcoTrack AI',
    description: 'Track emissions, get custom AI coaching, complete green missions, and earn eco rewards.',
    type: 'website',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="antialiased">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pb-12">
            {children}
          </main>
          
          <footer className="py-8 border-t border-white/5 bg-gray-950/20 backdrop-blur-md mt-12 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} EcoTrack AI. Powered by Google Gemini. All rights reserved.</p>
            <p className="mt-1.5 text-gray-600">Understand Your Impact. Reduce Your Footprint. Save the Planet.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
