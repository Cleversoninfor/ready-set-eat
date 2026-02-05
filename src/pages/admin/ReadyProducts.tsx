import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Search, ToggleLeft, ToggleRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ImageUpload } from '@/components/admin/ImageUpload';
import {
  useReadyProducts,
  useCreateReadyProduct,
  useUpdateReadyProduct,
  useDeleteReadyProduct,
  ReadyProduct,
} from '@/hooks/useReadyProducts';
import { useReadyCategories } from '@/hooks/useReadyCategories';
import { useToast } from '@/hooks/use-toast';

const AdminReadyProducts = () => {
  const { data: products, isLoading } = useReadyProducts();
  const { data: categories } = useReadyCategories();
  const createProduct = useCreateReadyProduct();
  const updateProduct = useUpdateReadyProduct();
  const deleteProduct = useDeleteReadyProduct();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ReadyProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    quantity_available: '',
    is_available: true,
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const formatCurrency = (value: number) =>
    Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      image_url: '',
      quantity_available: '',
      is_available: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: ReadyProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      quantity_available: product.quantity_available.toString(),
      is_available: product.is_available,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    const price = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast({ title: 'Preço inválido', variant: 'destructive' });
      return;
    }

    const quantity = parseInt(formData.quantity_available, 10);
    if (isNaN(quantity) || quantity < 0) {
      toast({ title: 'Quantidade inválida', variant: 'destructive' });
      return;
    }

    if (!formData.category_id) {
      toast({ title: 'Selecione uma categoria', variant: 'destructive' });
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description || '',
        price,
        category_id: formData.category_id,
        image_url: formData.image_url || '',
        quantity_available: quantity,
        is_available: formData.is_available,
      };

      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
        toast({ title: 'Produto atualizado!' });
      } else {
        await createProduct.mutateAsync(productData);
        toast({ title: 'Produto criado!' });
      }

      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (product: ReadyProduct) => {
    if (!confirm(`Deseja excluir "${product.name}"?`)) return;

    try {
      await deleteProduct.mutateAsync(product.id);
      toast({ title: 'Produto excluído!' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const toggleAvailability = async (product: ReadyProduct) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        is_available: !product.is_available,
      });
      toast({ 
        title: product.is_available ? 'Produto desativado' : 'Produto ativado',
      });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    return categories?.find(c => c.id === categoryId)?.name || 'Sem categoria';
  };

  const getQuantityBadge = (product: ReadyProduct) => {
    if (product.quantity_available === 0) {
      return <Badge variant="closed" className="text-[10px]">Esgotado</Badge>;
    }
    if (product.quantity_available <= 5) {
      return <Badge variant="warning" className="text-[10px]">{product.quantity_available} un.</Badge>;
    }
    return <Badge variant="open" className="text-[10px]">{product.quantity_available} un.</Badge>;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Produtos Prontos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Produtos Prontos">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-4">
          Produtos com quantidade limitada (lote do dia). A quantidade é reduzida automaticamente a cada pedido.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {categories?.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
          <p className="text-amber-600 text-sm">
            ⚠️ Você precisa criar pelo menos uma categoria em "Categorias Prontos" antes de adicionar produtos.
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredProducts.map((product) => (
          <div 
            key={product.id} 
            className="bg-card rounded-xl p-3 sm:p-4 shadow-card"
          >
            <div className="flex gap-3 sm:gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{product.name}</h3>
                  {getQuantityBadge(product)}
                </div>
                <p className="text-xs text-muted-foreground mb-1 truncate">
                  {getCategoryName(product.category_id)}
                </p>
                <p className="font-bold text-primary text-sm sm:text-base">{formatCurrency(product.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={product.is_available ? 'open' : 'closed'} className="text-[10px]">
                    {product.is_available ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-3 sm:mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => toggleAvailability(product)}
              >
                {product.is_available ? (
                  <><ToggleRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Desativar</>
                ) : (
                  <><ToggleLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Ativar</>
                )}
              </Button>
              <Button variant="action-icon" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => openEditModal(product)}>
                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button variant="action-icon-destructive" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => handleDelete(product)}>
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Produto Pronto' : 'Novo Produto Pronto'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <ImageUpload
                bucket="product-images"
                currentUrl={formData.image_url}
                onUpload={(url) => setFormData({ ...formData, image_url: url })}
                onRemove={() => setFormData({ ...formData, image_url: '' })}
              />
              <p className="text-xs text-muted-foreground">
                <strong>Recomendado:</strong> 400×400 pixels (quadrada, PNG ou JPG).
              </p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do produto"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do produto"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Preço *</label>
                <Input
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Quantidade *</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Categoria Prontos *</label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Categorias criadas em "Categorias Prontos"
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {(createProduct.isPending || updateProduct.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingProduct ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReadyProducts;
