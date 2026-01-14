import { useState, useEffect } from 'react';
import { Loader2, Store, Phone, CreditCard, Truck, MapPin, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { BrandSettings } from '@/components/admin/BrandSettings';
import { BannerSettings } from '@/components/admin/BannerSettings';
import { useStoreConfig, useUpdateStoreConfig } from '@/hooks/useStore';
import { useBusinessHours, useUpdateBusinessHour, getDayName, BusinessHour } from '@/hooks/useBusinessHours';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
const AdminSettings = () => {
  const {
    data: store,
    isLoading
  } = useStoreConfig();
  const {
    data: hours,
    isLoading: isLoadingHours
  } = useBusinessHours();
  const updateStore = useUpdateStoreConfig();
  const updateHour = useUpdateBusinessHour();
  const {
    toast
  } = useToast();
  const [editingHourId, setEditingHourId] = useState<string | null>(null);
  const [editHourData, setEditHourData] = useState({
    open_time: '',
    close_time: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    phone_whatsapp: '',
    pix_key: '',
    pix_key_type: 'Telefone',
    pix_message: '',
    logo_url: '',
    cover_url: '',
    delivery_fee: '',
    delivery_time_min: '',
    delivery_time_max: '',
    is_open: true,
    address: ''
  });
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        phone_whatsapp: store.phone_whatsapp || '',
        pix_key: store.pix_key || '',
        pix_key_type: store.pix_key_type || 'Telefone',
        pix_message: store.pix_message || '',
        logo_url: store.logo_url || '',
        cover_url: store.cover_url || '',
        delivery_fee: store.delivery_fee?.toString() || '',
        delivery_time_min: store.delivery_time_min?.toString() || '30',
        delivery_time_max: store.delivery_time_max?.toString() || '45',
        is_open: store.is_open ?? true,
        address: store.address || ''
      });
    }
  }, [store]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) {
      toast({
        title: 'Erro',
        description: 'Configuração não encontrada',
        variant: 'destructive'
      });
      return;
    }
    try {
      await updateStore.mutateAsync({
        id: store.id,
        name: formData.name,
        phone_whatsapp: formData.phone_whatsapp || null,
        pix_key: formData.pix_key || null,
        pix_key_type: formData.pix_key_type || null,
        pix_message: formData.pix_message || null,
        logo_url: formData.logo_url || null,
        cover_url: formData.cover_url || null,
        delivery_fee: parseFloat(formData.delivery_fee.replace(',', '.')) || 0,
        delivery_time_min: parseInt(formData.delivery_time_min) || 30,
        delivery_time_max: parseInt(formData.delivery_time_max) || 45,
        is_open: formData.is_open,
        address: formData.address || null
      });
      toast({
        title: 'Configurações salvas!'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const toggleStoreStatus = async () => {
    if (!store?.id) return;
    try {
      await updateStore.mutateAsync({
        id: store.id,
        is_open: !formData.is_open
      });
      setFormData({
        ...formData,
        is_open: !formData.is_open
      });
      toast({
        title: formData.is_open ? 'Loja fechada' : 'Loja aberta'
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        variant: 'destructive'
      });
    }
  };
  const handleEditHour = (hour: BusinessHour) => {
    setEditingHourId(hour.id);
    setEditHourData({
      open_time: hour.open_time,
      close_time: hour.close_time
    });
  };
  const handleSaveHour = async (hour: BusinessHour) => {
    try {
      await updateHour.mutateAsync({
        id: hour.id,
        open_time: editHourData.open_time,
        close_time: editHourData.close_time
      });
      setEditingHourId(null);
      toast({
        title: 'Horário atualizado!'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  const toggleHourActive = async (hour: BusinessHour) => {
    try {
      await updateHour.mutateAsync({
        id: hour.id,
        is_active: !hour.is_active
      });
      toast({
        title: hour.is_active ? 'Dia desativado' : 'Dia ativado'
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        variant: 'destructive'
      });
    }
  };
  if (isLoading) {
    return <AdminLayout title="Configurações">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>;
  }
  return <AdminLayout title="Configurações">

      <div className="max-w-2xl space-y-4 sm:space-y-6">
        {/* Store Status Card */}
        <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${formData.is_open ? 'bg-secondary/20' : 'bg-destructive/20'}`}>
                <Store className={`h-5 w-5 sm:h-6 sm:w-6 ${formData.is_open ? 'text-secondary' : 'text-destructive'}`} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Status da Loja</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {formData.is_open ? 'Recebendo pedidos' : 'Loja fechada para novos pedidos'}
                </p>
              </div>
            </div>
            <Switch checked={formData.is_open} onCheckedChange={toggleStoreStatus} />
          </div>
        </div>

        {/* Brand Customization */}
        <BrandSettings />

        {/* Banner Customization */}
        <BannerSettings />

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Store Info */}
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Informações da Loja
            </h3>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground">Nome da Loja *</label>
              <Input value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="Nome do seu restaurante" className="mt-1" />
            </div>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground">Logo</label>
              <ImageUpload bucket="store-assets" currentUrl={formData.logo_url} onUpload={url => setFormData({
              ...formData,
              logo_url: url
            })} onRemove={() => setFormData({
              ...formData,
              logo_url: ''
            })} className="mt-1" />
            </div>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground">Imagem de Capa</label>
              <ImageUpload bucket="store-assets" currentUrl={formData.cover_url} onUpload={url => setFormData({
              ...formData,
              cover_url: url
            })} onRemove={() => setFormData({
              ...formData,
              cover_url: ''
            })} className="mt-1" />
            </div>
          </div>

          {/* Address */}
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Endereço
            </h3>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground">Endereço completo</label>
              <Input value={formData.address} onChange={e => setFormData({
              ...formData,
              address: e.target.value
            })} placeholder="Rua, número, bairro, cidade" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Será exibido no cardápio para os clientes</p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Contato
            </h3>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground">WhatsApp</label>
              <Input value={formData.phone_whatsapp} onChange={e => setFormData({
              ...formData,
              phone_whatsapp: e.target.value
            })} placeholder="11999999999" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Apenas números, com DDD</p>
            </div>
          </div>

          {/* PIX */}
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Chave PIX
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs sm:text-sm text-muted-foreground">Tipo da Chave</label>
                <Select value={formData.pix_key_type} onValueChange={value => setFormData({
                ...formData,
                pix_key_type: value
              })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                    <SelectItem value="CPF">CPF</SelectItem>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Aleatória">Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs sm:text-sm text-muted-foreground">Chave PIX</label>
                <Input value={formData.pix_key} onChange={e => setFormData({
                ...formData,
                pix_key: e.target.value
              })} placeholder="Sua chave PIX" className="mt-1" />
              </div>
            </div>
          </div>

          {/* PIX Message */}
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Mensagem de Cobrança PIX
            </h3>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground">Mensagem personalizada</label>
              <Textarea 
                value={formData.pix_message} 
                onChange={e => setFormData({
                  ...formData,
                  pix_message: e.target.value
                })} 
                placeholder="Olá {nome}! 🍔&#10;&#10;Pedido #{pedido} recebido!&#10;&#10;Total: {total}&#10;&#10;💠 Chave Pix: {chave_pix} ({tipo_chave})&#10;&#10;Aguardamos o comprovante para iniciar o preparo!"
                className="mt-1 min-h-[120px] font-mono text-sm"
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use as variáveis: <code className="bg-muted px-1 rounded">{'{nome}'}</code>, <code className="bg-muted px-1 rounded">{'{pedido}'}</code>, <code className="bg-muted px-1 rounded">{'{total}'}</code>, <code className="bg-muted px-1 rounded">{'{chave_pix}'}</code>, <code className="bg-muted px-1 rounded">{'{tipo_chave}'}</code>
              </p>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Entrega
            </h3>

            <div>
              <label className="text-xs sm:text-sm text-muted-foreground">Taxa de Entrega (R$)</label>
              <Input value={formData.delivery_fee} onChange={e => setFormData({
              ...formData,
              delivery_fee: e.target.value
            })} placeholder="5,00" className="mt-1" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs sm:text-sm text-muted-foreground">Tempo Mínimo (min)</label>
                <Input type="number" value={formData.delivery_time_min} onChange={e => setFormData({
                ...formData,
                delivery_time_min: e.target.value
              })} placeholder="30" className="mt-1" />
              </div>
              <div>
                <label className="text-xs sm:text-sm text-muted-foreground">Tempo Máximo (min)</label>
                <Input type="number" value={formData.delivery_time_max} onChange={e => setFormData({
                ...formData,
                delivery_time_max: e.target.value
              })} placeholder="45" className="mt-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Exibido como "{formData.delivery_time_min || 30}-{formData.delivery_time_max || 45} min" no cardápio</p>
          </div>

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full" disabled={updateStore.isPending}>
            {updateStore.isPending ? <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </> : 'Salvar Configurações'}
          </Button>
        </form>

        {/* Business Hours - Outside form since it saves individually */}
        
      </div>
    </AdminLayout>;
};
export default AdminSettings;