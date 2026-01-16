import { useState } from 'react';
import { Category } from '@/hooks/useCategories';
import { cn } from '@/lib/utils';

interface CategoryIconsProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
}

export function CategoryIcons({ categories, onCategorySelect }: CategoryIconsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (categoryId: string | null) => {
    setSelectedId(categoryId);
    if (categoryId) {
      onCategorySelect(categoryId);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mt-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-foreground">Categorias</h3>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* Todos */}
        <button
          onClick={() => handleSelect(null)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
            selectedId === null
              ? "bg-primary text-primary-foreground shadow-card"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          Todos
        </button>

        {categories.map((category) => {
          const isSelected = selectedId === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
