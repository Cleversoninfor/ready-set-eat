import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HeroHeader } from '@/components/menu/HeroHeader';
import { StoreInfo } from '@/components/menu/StoreInfo';
import { CategoryIcons } from '@/components/menu/CategoryIcons';
import { MenuSection } from '@/components/menu/MenuSection';
import { ProductModal } from '@/components/menu/ProductModal';
import { CartButton } from '@/components/cart/CartButton';
import { FloatingOrderButton, getLastOrderId } from '@/components/order/FloatingOrderButton';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { InfornexaBanner } from '@/components/menu/InfornexaBanner';
import { useStoreConfig } from '@/hooks/useStore';
import { useCategories, Category } from '@/hooks/useCategories';
import { useProducts, Product } from '@/hooks/useProducts';
import { useReadyCategories } from '@/hooks/useReadyCategories';
import { useAvailableReadyProducts, ReadyProduct } from '@/hooks/useReadyProducts';
import { useTheme } from '@/hooks/useTheme';
import { useStoreStatus } from '@/hooks/useStoreStatus';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Combined product type for unified handling
export interface DisplayProduct extends Omit<Product, 'category_id'> {
  category_id: string;
  isReadyProduct?: boolean;
  quantity_available?: number;
}

interface EditingProduct {
  product: Product;
  quantity: number;
  observation: string;
  returnTo: string | null;
  selectedAddons?: Record<string, string[]>;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { data: store, isLoading: storeLoading } = useStoreConfig();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: readyCategories, isLoading: readyCategoriesLoading } = useReadyCategories();
  const { data: readyProducts, isLoading: readyProductsLoading } = useAvailableReadyProducts();
  const storeStatus = useStoreStatus();

  // Apply dynamic theme based on store colors
  useTheme();

  const isLoading = storeLoading || categoriesLoading || productsLoading || readyCategoriesLoading || readyProductsLoading;

  // Combine regular and ready categories
  const allCategories = useMemo(() => {
    const regularCats = categories || [];
    const readyCats: Category[] = (readyCategories || []).map(rc => ({
      id: `ready_${rc.id}`,
      name: rc.name,
      sort_order: rc.sort_order + 1000, // Put ready categories after regular ones
      image_url: rc.image_url,
    }));
    return [...regularCats, ...readyCats];
  }, [categories, readyCategories]);

  // Combine regular and ready products
  const allProducts = useMemo(() => {
    const regularProds: DisplayProduct[] = (products || []).map(p => ({
      ...p,
      category_id: p.category_id || '',
      isReadyProduct: false,
    }));
    const readyProds: DisplayProduct[] = (readyProducts || []).map(rp => ({
      id: rp.id,
      name: rp.name,
      description: rp.description,
      price: rp.price,
      image_url: rp.image_url,
      is_available: rp.is_available && rp.quantity_available > 0,
      category_id: `ready_${rp.category_id}`,
      isReadyProduct: true,
      quantity_available: rp.quantity_available,
    }));
    return [...regularProds, ...readyProds];
  }, [products, readyProducts]);

  // Check for last order on mount
  useEffect(() => {
    const orderId = getLastOrderId();
    setLastOrderId(orderId);
  }, []);

  // Handle URL params for editing products from cart/checkout
  useEffect(() => {
    const productId = searchParams.get('product');
    const rawObservation = searchParams.get('observation') || '';
    const quantity = parseInt(searchParams.get('quantity') || '1', 10);
    const returnTo = searchParams.get('returnTo');
    const addonsParam = searchParams.get('addons');

    const sanitizeObservation = (value: string) => {
      const v = value.trim();
      if (!v) return '';

      // Legacy format previously stored: "Adicionais: ... | Obs: ..."
      const obsMarker = 'Obs:';
      if (v.includes(obsMarker)) {
        const idx = v.lastIndexOf(obsMarker);
        const extracted = v.slice(idx + obsMarker.length).trim();
        return extracted;
      }

      // If it only contains legacy addons text, drop it
      if (v.startsWith('Adicionais:')) return '';

      return v;
    };

    if (productId && products) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        let selectedAddons: Record<string, string[]> | undefined;
        if (addonsParam) {
          try {
            selectedAddons = JSON.parse(decodeURIComponent(addonsParam));
          } catch (e) {
            console.error('Error parsing addons:', e);
          }
        }

        setEditingProduct({
          product,
          quantity,
          observation: sanitizeObservation(rawObservation),
          returnTo,
          selectedAddons,
        });
        // Clear the URL params
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, products, setSearchParams]);

  const scrollToCategory = (categoryId: string) => {
    const element = sectionRefs.current[categoryId];
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setEditingProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">Restaurante não configurado</p>
          <a 
            href="/auth" 
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Configurar Restaurante
          </a>
        </div>
      </div>
    );
  }

  // Filter products by search
  const filteredProducts = products?.filter(product => 
    searchQuery === '' || 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  ) || [];

  // Group products by category
  const productsByCategory = categories?.map(category => ({
    category,
    products: filteredProducts.filter(p => p.category_id === category.id)
  })).filter(group => group.products.length > 0) || [];

  const totalItems = filteredProducts.length;

  // Determine which modal to show
  const modalProduct = editingProduct?.product || selectedProduct;
  const isEditing = !!editingProduct;

  return (
    <>
      <Helmet>
        <title>{store.name} - Cardápio Digital</title>
        <meta name="description" content={`Peça online no ${store.name}. Lanches, bebidas e muito mais com entrega rápida.`} />
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Hero Header */}
        <HeroHeader store={store} />


        {/* Store Info */}
        <StoreInfo store={store} />

        {/* Search Bar - Above Categories */}
        <div className="px-4 mt-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Procurar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-card pl-4 pr-12 shadow-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <CategoryIcons 
            categories={categories} 
            onCategorySelect={scrollToCategory}
          />
        )}

        {/* Cardápio Header */}
        <div className="px-4 pt-2 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Cardápio</h2>
          <span className="text-sm text-muted-foreground">{totalItems} itens</span>
        </div>

        {/* Menu Sections */}
        <div className="px-4 space-y-6">
          {productsByCategory.map(({ category, products }) => (
            <MenuSection
              key={category.id}
              ref={(el) => { sectionRefs.current[category.id] = el; }}
              category={category}
              products={products}
              onProductSelect={setSelectedProduct}
            />
          ))}

          {productsByCategory.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado ainda'}
              </p>
              {!searchQuery && store.name === 'Meu Restaurante' && (
                <a 
                  href="/admin" 
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Acessar Painel Admin
                </a>
              )}
            </div>
          )}
        </div>

        {/* Infornexa Advertisement Banner */}
        <InfornexaBanner />

        {/* Floating Order Button */}
        {lastOrderId && (
          <FloatingOrderButton 
            orderId={lastOrderId} 
            onDismiss={() => setLastOrderId(null)} 
          />
        )}

        {/* PWA Install Prompt */}
        <InstallPrompt />

        <CartButton />
        
        {modalProduct && (
          <ProductModal
            product={modalProduct}
            onClose={handleCloseModal}
            initialQuantity={editingProduct?.quantity}
            initialObservation={editingProduct?.observation}
            initialAddons={editingProduct?.selectedAddons}
            isEditing={isEditing}
            returnTo={editingProduct?.returnTo}
          />
        )}
      </div>
    </>
  );
};

export default Index;
