import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StoreConfig } from '@/hooks/useStore';
import { useCart } from '@/hooks/useCart';

interface HeroHeaderProps {
  store: StoreConfig;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=400&fit=crop';

export function HeroHeader({ store }: HeroHeaderProps) {
  const { totalItems } = useCart();

  const coverUrl = store.cover_url || DEFAULT_COVER;

  return (
    <header className="relative">
      {/* Hero Image Section */}
      <div className="relative h-44 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${coverUrl}')` }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-foreground/50" />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-end p-4">
          <Link
            to="/cart"
            aria-label="Abrir carrinho"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {/* Store Name - Positioned at bottom center */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <h1 className="mx-0 my-[27px] text-xl font-bold uppercase tracking-wide text-background">
            {store.name}
          </h1>
        </div>
      </div>

      {/* Logo Avatar - Overlapping the hero */}
      <div className="relative z-20 flex justify-center -mt-10">
        <div className="h-20 w-20 rounded-full border-4 border-background bg-background shadow-lg overflow-hidden">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={`Logo do restaurante ${store.name}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
              <span className="text-3xl">🍔</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
