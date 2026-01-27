import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const formattedPrice = Number(product.price).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <button
      onClick={() => product.is_available && onSelect(product)}
      disabled={!product.is_available}
      className={cn(
        "group flex w-full flex-col rounded-2xl bg-card text-left shadow-card overflow-hidden transition-all duration-200",
        product.is_available 
          ? "hover:shadow-card-hover active:scale-[0.98]" 
          : "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Image - Fixed 540x280 ratio */}
      {product.image_url && (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: '540/280' }}>
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain bg-muted/30 transition-transform duration-200 group-hover:scale-105"
          />
          {!product.is_available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-xs font-bold uppercase text-white">Esgotado</span>
            </div>
          )}
          {product.is_available && (
            <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
              <Plus className="h-4 w-4" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-foreground leading-tight">{product.name}</h3>
            {!product.is_available && !product.image_url && (
              <Badge variant="closed" className="text-[10px]">Esgotado</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-bold text-foreground">{formattedPrice}</span>
        </div>
      </div>
    </button>
  );
}
