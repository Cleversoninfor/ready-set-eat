import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!coupon) throw new Error('Cupom não encontrado');
      
      // Check if expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        throw new Error('Cupom expirado');
      }
      
      // Check max uses
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        throw new Error('Cupom esgotado');
      }
      
      // Check min order value
      if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
        throw new Error(`Pedido mínimo de R$ ${coupon.min_order_value.toFixed(2)} para usar este cupom`);
      }
      
      return coupon as Coupon;
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coupon: Omit<Coupon, 'id' | 'current_uses' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          ...coupon,
          code: coupon.code.toUpperCase(),
          current_uses: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<Coupon> & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}

export function calculateDiscount(coupon: Coupon, orderTotal: number): number {
  if (coupon.discount_type === 'percentage') {
    return (orderTotal * coupon.discount_value) / 100;
  }
  return coupon.discount_value;
}
