import { useState, useEffect } from 'react';
import { Loader2, Image, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { useStoreConfig, useUpdateStoreConfig } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';

interface BannerSettingsProps {
  className?: string;
}

export function BannerSettings({ className }: BannerSettingsProps) {
  const { data: store, isLoading } = useStoreConfig();
  const updateStore = useUpdateStoreConfig();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cover_url: '',
    hero_text_1: 'Carne macia',
    hero_text_2: 'Suculenta',
    hero_text_3: 'Sabor Irresistível',
    hero_slogan: 'O segredo está no tempero',
  });

  useEffect(() => {
    if (store) {
      setFormData({
        cover_url: store.cover_url || '',
        hero_text_1: store.hero_text_1 || 'Carne macia',
        hero_text_2: store.hero_text_2 || 'Suculenta',
        hero_text_3: store.hero_text_3 || 'Sabor Irresistível',
        hero_slogan: store.hero_slogan || 'O segredo está no tempero',
      });
    }
  }, [store]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updateData: any = {
        cover_url: formData.cover_url || null,
        hero_text_1: formData.hero_text_1 || null,
        hero_text_2: formData.hero_text_2 || null,
        hero_text_3: formData.hero_text_3 || null,
        hero_slogan: formData.hero_slogan || null,
      };
      
      if (store?.id) {
        updateData.id = store.id;
      }
      
      await updateStore.mutateAsync(updateData);
      toast({ title: 'Banner atualizado com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
          <Image className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Personalização do Banner
        </h3>

        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure a imagem de fundo e os textos animados do banner principal. 
          O banner ocupa tela cheia no mobile (1080x1920px) e largura total no desktop (1920x1080px).
        </p>

        {/* Cover Image */}
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm text-muted-foreground">
            Imagem de Fundo do Banner
          </Label>
          <ImageUpload
            bucket="store-assets"
            currentUrl={formData.cover_url}
            onUpload={(url) => setFormData({ ...formData, cover_url: url })}
            onRemove={() => setFormData({ ...formData, cover_url: '' })}
          />
          <p className="text-xs text-muted-foreground">
            Recomendado: 1920x1080 pixels para melhor qualidade em todas as telas
          </p>
        </div>

        {/* Divider */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-sm flex items-center gap-2 mb-4">
            <Type className="h-4 w-4 text-primary" />
            Textos Animados
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            Estes textos aparecem alternadamente no banner com efeito de transição
          </p>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground">Texto 1</Label>
              <Input
                value={formData.hero_text_1}
                onChange={(e) => setFormData({ ...formData, hero_text_1: e.target.value })}
                placeholder="Ex: Carne macia"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground">Texto 2</Label>
              <Input
                value={formData.hero_text_2}
                onChange={(e) => setFormData({ ...formData, hero_text_2: e.target.value })}
                placeholder="Ex: Suculenta"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground">Texto 3</Label>
              <Input
                value={formData.hero_text_3}
                onChange={(e) => setFormData({ ...formData, hero_text_3: e.target.value })}
                placeholder="Ex: Sabor Irresistível"
              />
            </div>
          </div>
        </div>

        {/* Slogan */}
        <div className="border-t pt-6 space-y-2">
          <Label className="text-xs sm:text-sm text-muted-foreground">Slogan</Label>
          <Input
            value={formData.hero_slogan}
            onChange={(e) => setFormData({ ...formData, hero_slogan: e.target.value })}
            placeholder="Ex: O segredo está no tempero"
          />
          <p className="text-xs text-muted-foreground">
            Aparece acima do nome do restaurante no banner
          </p>
        </div>

        {/* Preview */}
        <div className="border-t pt-6 space-y-2">
          <Label className="text-xs sm:text-sm text-muted-foreground">Preview dos Textos</Label>
          <div className="p-4 rounded-lg bg-gradient-to-b from-black/80 to-black/60 text-white">
            <p className="text-sm italic text-white/80 mb-2">{formData.hero_slogan}</p>
            <p className="text-lg font-bold mb-1">{store?.name || 'Nome do Restaurante'}</p>
            <div className="space-y-1">
              <p className="text-primary font-bold">{formData.hero_text_1}</p>
              <p className="text-primary/70 font-bold text-sm">→ {formData.hero_text_2}</p>
              <p className="text-primary/50 font-bold text-xs">→ {formData.hero_text_3}</p>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={updateStore.isPending}>
          {updateStore.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            'Salvar Banner'
          )}
        </Button>
      </div>
    </form>
  );
}
