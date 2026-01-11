import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Model Platform - Run ML Models',
  description: 'Browse and run state-of-the-art machine learning models. Generate images, videos, audio, and text using the latest AI models.',
  keywords: ['AI', 'machine learning', 'models', 'image generation', 'text to image', 'LLM'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased min-h-screen`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-gray-800 py-6 mt-auto">
            <div className="container mx-auto px-4">
              <p className="text-center text-sm text-gray-500">
                Powered by Replicate API • Built with Next.js
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
