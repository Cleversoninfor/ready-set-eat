import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ReadyProduct {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string;
  quantity_available: number;
  is_available: boolean;
}

export function useReadyProducts() {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates for quantity changes
  useEffect(() => {
    const channel = supabase
      .channel('ready_products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ready_products',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ready-products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['ready-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ready_products')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data.map(p => ({
        ...p,
        description: p.description || '',
        image_url: p.image_url || '',
      })) as ReadyProduct[];
    },
  });
}

export function useAvailableReadyProducts() {
  const queryClient = useQueryClient();

  // Subscribe to realtime updates for quantity changes
  useEffect(() => {
    const channel = supabase
      .channel('ready_products_available')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ready_products',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ready-products-available'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['ready-products-available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ready_products')
        .select('*')
        .eq('is_available', true)
        .gt('quantity_available', 0)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data.map(p => ({
        ...p,
        description: p.description || '',
        image_url: p.image_url || '',
      })) as ReadyProduct[];
    },
  });
}

export function useCreateReadyProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Omit<ReadyProduct, 'id'>) => {
      const { data, error } = await supabase
        .from('ready_products')
        .insert({
          name: product.name,
          description: product.description,
          price: product.price,
          category_id: product.category_id,
          image_url: product.image_url,
          quantity_available: product.quantity_available,
          is_available: product.is_available,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-products'] });
      queryClient.invalidateQueries({ queryKey: ['ready-products-available'] });
    },
  });
}

export function useUpdateReadyProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<ReadyProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('ready_products')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-products'] });
      queryClient.invalidateQueries({ queryKey: ['ready-products-available'] });
    },
  });
}

export function useDeleteReadyProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ready_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-products'] });
      queryClient.invalidateQueries({ queryKey: ['ready-products-available'] });
    },
  });
}

export function useDecrementReadyProductQuantity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      // First get current quantity
      const { data: current, error: fetchError } = await supabase
        .from('ready_products')
        .select('quantity_available')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newQuantity = Math.max(0, (current?.quantity_available || 0) - quantity);
      
      const { data, error } = await supabase
        .from('ready_products')
        .update({ quantity_available: newQuantity })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-products'] });
      queryClient.invalidateQueries({ queryKey: ['ready-products-available'] });
    },
  });
}
