import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ModelHub - Run AI Models',
  description: 'Discover and run state-of-the-art AI models. Generate images, video, audio, and text.',
  keywords: ['AI', 'machine learning', 'models', 'image generation', 'video AI', 'LLM'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-[#1f1f1f] py-8 mt-16">
            <div className="container mx-auto px-6">
              <p className="text-center text-sm text-[#737373]">
                Powered by Replicate
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
