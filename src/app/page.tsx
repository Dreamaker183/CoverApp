import ProductPageClient from '@/components/product/ProductPageClient';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PackageIcon } from 'lucide-react';

export default function Home() {
  return (
    <>
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-3 md:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <PackageIcon className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-headline font-semibold text-primary">CoverCraft</h1>
          </Link>
          {/* Add other nav items here if needed */}
        </div>
      </header>
      <main className="flex-grow py-8">
        <ProductPageClient />
      </main>
      <footer className="bg-card border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CoverCraft. All rights reserved.
        </p>
      </footer>
    </>
  );
}
