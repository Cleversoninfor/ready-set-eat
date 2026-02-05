import { forwardRef } from 'react';
import { Category } from '@/hooks/useCategories';
import { MenuProductCard } from './MenuProductCard';

// Extended product type that includes ready product fields
export interface DisplayProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  category_id: string;
  isReadyProduct?: boolean;
  quantity_available?: number;
}

interface MenuSectionProps {
  category: Category;
  products: DisplayProduct[];
  onProductSelect: (product: DisplayProduct) => void;
}

const categoryEmojis: Record<string, string> = {
  'Lanches': '🍔',
  'Hambúrgueres': '🍔',
  'Porções': '🍟',
  'Acompanhamentos': '🍟',
  'Bebidas': '🥤',
  'Combos': '🎁',
  'Sobremesas': '🍰',
};

export const MenuSection = forwardRef<HTMLDivElement, MenuSectionProps>(
  ({ category, products, onProductSelect }, ref) => {
    const emoji = categoryEmojis[category.name] || '📦';

    return (
      <div ref={ref}>
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{emoji}</span>
          <h3 className="text-base font-bold text-foreground">{category.name}</h3>
        </div>

        {/* Products */}
        <div className="space-y-3">
          {products.map((product) => (
            <MenuProductCard
              key={product.id}
              product={product}
              onSelect={onProductSelect}
            />
          ))}
        </div>
      </div>
    );
  }
);

MenuSection.displayName = 'MenuSection';
