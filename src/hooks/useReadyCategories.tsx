import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReadyCategory {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
}

export function useReadyCategories() {
  return useQuery({
    queryKey: ['ready-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ready_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as ReadyCategory[];
    },
  });
}

export function useCreateReadyCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: { name: string; sort_order: number; image_url?: string | null }) => {
      const { data, error } = await supabase
        .from('ready_categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-categories'] });
    },
  });
}

export function useUpdateReadyCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<ReadyCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('ready_categories')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-categories'] });
    },
  });
}

export function useDeleteReadyCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ready_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-categories'] });
    },
  });
}

export function useReorderReadyCategories() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('ready_categories')
          .update({ sort_order: index + 1 })
          .eq('id', id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-categories'] });
    },
  });
}
