import { Category } from '@/hooks/useCategories';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { CategoriesModal } from './CategoriesModal';

interface CategoryIconsProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
}

const categoryEmojis: Record<string, string> = {
  'Lanches': '🍔',
  'Hambúrgueres': '🍔',
  'Porções': '🍟',
  'Acompanhamentos': '🍟',
  'Bebidas': '🥤',
  'Combos': '🍱',
  'Sobremesas': '🍨',
};

export function CategoryIcons({ categories, onCategorySelect }: CategoryIconsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleSelect = (categoryId: string | null) => {
    setSelectedId(categoryId);
    if (categoryId) {
      onCategorySelect(categoryId);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="mt-6 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-foreground">Categorias</h3>
          <button 
            onClick={() => setShowAllCategories(true)}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            Ver todas
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Todos */}
          <button
            onClick={() => handleSelect(null)}
            className="flex flex-col items-center gap-2 min-w-[72px]"
          >
            <div className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
              selectedId === null 
                ? "bg-primary shadow-md" 
                : "bg-muted"
            )}>
              <span className="text-2xl">🍽️</span>
            </div>
            <span className={cn(
              "text-xs font-medium text-center",
              selectedId === null ? "text-primary" : "text-muted-foreground"
            )}>
              Todos
            </span>
          </button>

          {categories.map((category) => {
            const emoji = categoryEmojis[category.name] || '🍴';
            const isSelected = selectedId === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => handleSelect(category.id)}
                className="flex flex-col items-center gap-2 min-w-[72px]"
              >
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors overflow-hidden",
                  isSelected 
                    ? "bg-primary shadow-md" 
                    : "bg-muted"
                )}>
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{emoji}</span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium text-center line-clamp-1",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <CategoriesModal
        open={showAllCategories}
        onOpenChange={setShowAllCategories}
        categories={categories}
        onCategorySelect={handleSelect}
      />
    </>
  );
}
