import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

export function useBusinessHours() {
  return useQuery({
    queryKey: ['business-hours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week', { ascending: true });
      
      if (error) throw error;
      return data as BusinessHour[];
    },
  });
}

export function useUpdateBusinessHour() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<BusinessHour> & { id: string }) => {
      const { data, error } = await supabase
        .from('business_hours')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours'] });
    },
  });
}

export function useCreateBusinessHours() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        open_time: '08:00',
        close_time: '22:00',
        is_active: true,
      }));
      
      const { data, error } = await supabase
        .from('business_hours')
        .insert(defaultHours)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours'] });
    },
  });
}

export function useDeleteBusinessHour() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('business_hours')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours'] });
    },
  });
}

// Helper to get day name
export function getDayName(day: number): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[day] || '';
}

// Helper to check if store is currently open
export function isStoreCurrentlyOpen(hours: BusinessHour[]): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);
  
  const todayHours = hours.find(h => h.day_of_week === currentDay);
  
  if (!todayHours || !todayHours.is_active) return false;
  
  const openTime = todayHours.open_time;
  const closeTime = todayHours.close_time;
  
  // Handle midnight (00:00) as end of day - treat it as 24:00 for comparison
  if (closeTime === '00:00') {
    // Store is open from open_time until midnight
    return currentTime >= openTime;
  }
  
  // Handle overnight hours (e.g., 18:00 to 02:00)
  if (closeTime < openTime) {
    // Store spans midnight - open if current time is after open OR before close
    return currentTime >= openTime || currentTime <= closeTime;
  }
  
  // Normal hours (e.g., 08:00 to 22:00)
  return currentTime >= openTime && currentTime <= closeTime;
}

// Hook to check if store is open
export function useIsStoreOpen() {
  const { data: hours = [] } = useBusinessHours();
  return isStoreCurrentlyOpen(hours);
}
