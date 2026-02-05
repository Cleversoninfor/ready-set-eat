import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, GripVertical, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ImageUpload } from '@/components/admin/ImageUpload';
import {
  useReadyCategories,
  useCreateReadyCategory,
  useUpdateReadyCategory,
  useDeleteReadyCategory,
  useReorderReadyCategories,
  ReadyCategory,
} from '@/hooks/useReadyCategories';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCategoryItemProps {
  category: ReadyCategory;
  onEdit: (category: ReadyCategory) => void;
  onDelete: (category: ReadyCategory) => void;
}

function SortableCategoryItem({ category, onEdit, onDelete }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card rounded-lg shadow-card"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {category.image_url ? (
          <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <span className="flex-1 font-medium text-foreground">{category.name}</span>

      <div className="flex gap-2">
        <Button variant="action-icon" size="icon" onClick={() => onEdit(category)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="action-icon-destructive" size="icon" onClick={() => onDelete(category)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const AdminReadyCategories = () => {
  const { data: categories, isLoading } = useReadyCategories();
  const createCategory = useCreateReadyCategory();
  const updateCategory = useUpdateReadyCategory();
  const deleteCategory = useDeleteReadyCategory();
  const reorderCategories = useReorderReadyCategories();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ReadyCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', image_url: '' });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', image_url: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (category: ReadyCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, image_url: category.image_url || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: formData.name,
          image_url: formData.image_url || null,
        });
        toast({ title: 'Categoria atualizada!' });
      } else {
        const maxOrder = categories?.reduce((max, c) => Math.max(max, c.sort_order), 0) || 0;
        await createCategory.mutateAsync({
          name: formData.name,
          sort_order: maxOrder + 1,
          image_url: formData.image_url || null,
        });
        toast({ title: 'Categoria criada!' });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (category: ReadyCategory) => {
    if (!confirm(`Deseja excluir "${category.name}"?`)) return;

    try {
      await deleteCategory.mutateAsync(category.id);
      toast({ title: 'Categoria excluída!' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    const newOrder = arrayMove(categories, oldIndex, newIndex);
    
    try {
      await reorderCategories.mutateAsync(newOrder.map((c) => c.id));
    } catch (error: any) {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Categorias Prontos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Categorias Prontos">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-4">
          Categorias para produtos com quantidade limitada (lote do dia). Arraste para reordenar.
        </p>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories?.map((c) => c.id) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {categories?.map((category) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {categories?.length === 0 && (
        <div className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma categoria criada ainda</p>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ImageUpload
              bucket="product-images"
              currentUrl={formData.image_url}
              onUpload={(url) => setFormData({ ...formData, image_url: url })}
              onRemove={() => setFormData({ ...formData, image_url: '' })}
            />

            <div>
              <label className="text-sm text-muted-foreground">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Espetinhos Prontos"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {(createCategory.isPending || updateCategory.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingCategory ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReadyCategories;
