import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreConfig {
  id: string;
  name: string;
  phone_whatsapp: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_message: string | null;
  logo_url: string | null;
  cover_url: string | null;
  is_open: boolean;
  delivery_fee: number;
  delivery_fee_mode: 'fixed' | 'zones' | null;
  min_order_value: number;
  address: string | null;
  delivery_time_min: number | null;
  delivery_time_max: number | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  pwa_name: string | null;
  pwa_short_name: string | null;
}

export function useStoreConfig() {
  return useQuery({
    queryKey: ['store-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_config')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      
      // If no store config exists, return default values
      if (!data) {
        return {
          id: '',
          name: 'Meu Restaurante',
          phone_whatsapp: null,
          pix_key: null,
          pix_key_type: null,
          pix_message: null,
          logo_url: null,
          cover_url: null,
          is_open: true,
          delivery_fee: 5,
          delivery_fee_mode: 'fixed' as const,
          min_order_value: 20,
          address: null,
          delivery_time_min: 30,
          delivery_time_max: 45,
          primary_color: '25 95% 53%',
          secondary_color: '142 76% 36%',
          accent_color: '25 100% 95%',
          pwa_name: 'Cardápio',
          pwa_short_name: 'Cardápio',
        } as StoreConfig;
      }
      
      return data as StoreConfig;
    },
  });
}

export function useUpdateStoreConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<StoreConfig> & { id: string }) => {
      // If no id, we need to create the config first
      if (!id) {
        const { data, error } = await supabase
          .from('store_config')
          .insert(update)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
      
      const { data, error } = await supabase
        .from('store_config')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-config'] });
    },
  });
}
