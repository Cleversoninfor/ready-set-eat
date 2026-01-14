import { UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StoreConfig } from '@/hooks/useStore';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';

interface HeroHeaderProps {
  store: StoreConfig;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&h=800&fit=crop';

export function HeroHeader({ store }: HeroHeaderProps) {
  const { totalItems } = useCart();

  const coverUrl = store.cover_url || DEFAULT_COVER;

  const scrollToMenu = () => {
    const menuSection = document.querySelector('[data-menu-section]');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 500, behavior: 'smooth' });
    }
  };

  return (
    <header className="relative">
      {/* Full Hero Section */}
      <div className="relative min-h-[420px] sm:min-h-[480px] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${coverUrl}')` }}
        />

        {/* Dark Overlay with texture effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        {/* Navigation Bar */}
        <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-primary bg-background shadow-lg overflow-hidden flex-shrink-0">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={`Logo ${store.name}`}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                  <span className="text-xl">🍔</span>
                </div>
              )}
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={scrollToMenu}
              className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              <UtensilsCrossed className="h-4 w-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </button>
            <Link
              to="/my-orders"
              className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Meus pedidos</span>
              {totalItems > 0 && (
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 px-4 sm:px-8 pt-6 sm:pt-10 pb-10">
          {/* Tagline */}
          {store.address && (
            <p className="text-base sm:text-lg italic text-white/80 mb-6 sm:mb-8">
              {store.address}
            </p>
          )}

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-3 drop-shadow-lg"
              style={{ fontFamily: "'Poppins', sans-serif", textShadow: '2px 4px 8px rgba(0,0,0,0.4)' }}>
            {store.name}
          </h1>

          {/* Subtitle/Slogan */}
          <p className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white/95 mb-6 drop-shadow-md"
             style={{ fontFamily: "'Poppins', sans-serif", textShadow: '2px 4px 8px rgba(0,0,0,0.3)' }}>
            Sabor irresistível
          </p>

          {/* Info Line */}
          <div className="flex flex-col gap-1 text-white/90 mb-6 text-sm sm:text-base font-medium">
            <span>Entrega Rápida!</span>
            {store.phone_whatsapp && (
              <span>{store.phone_whatsapp}</span>
            )}
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToMenu}
            size="lg"
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold px-8 py-3 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            Cardápio
          </Button>
        </div>

        {/* Decorative dots pattern (optional subtle effect) */}
        <div className="absolute right-4 sm:right-12 top-1/3 flex flex-col gap-2 opacity-40">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/60" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
