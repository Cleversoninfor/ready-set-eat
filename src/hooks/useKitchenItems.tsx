import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KitchenItem {
  id: string;
  table_order_id: number | null;
  order_id: number | null;
  product_id: string | null;
  product_name: string;
  quantity: number;
  observation: string | null;
  unit_price: number;
  status: string;
  ordered_at: string;
  delivered_at: string | null;
  table_number: number | null;
  table_name: string | null;
  waiter_name: string | null;
  order_type: 'table' | 'delivery';
  customer_name?: string;
}

type KitchenItemStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export function useKitchenItems(statusFilter?: KitchenItemStatus) {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['kitchen-items', statusFilter],
    queryFn: async (): Promise<KitchenItem[]> => {
      // Use the RPC function to get kitchen items
      const { data, error } = await supabase.rpc('get_kitchen_items', {
        _status_filter: statusFilter || null,
      });

      if (error) {
        console.error('Error fetching kitchen items:', error);
        throw error;
      }

      // Transform the data to match KitchenItem interface
      return (data || []).map((item: any) => ({
        id: item.id,
        table_order_id: item.table_order_id,
        order_id: item.order_id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        observation: item.observation,
        unit_price: item.unit_price,
        status: item.status || 'pending',
        ordered_at: item.ordered_at || new Date().toISOString(),
        delivered_at: item.delivered_at,
        table_number: item.table_number,
        table_name: item.table_name,
        waiter_name: item.waiter_name,
        order_type: item.order_type as 'table' | 'delivery',
        customer_name: item.customer_name,
      }));
    },
    refetchInterval: 5000, // Poll every 5 seconds for new orders
  });

  return { items, isLoading, error };
}

export function useKitchenItemMutations() {
  const queryClient = useQueryClient();

  const updateItemStatus = async (itemId: string, newStatus: KitchenItemStatus, orderType: 'table' | 'delivery' = 'table', orderId?: number) => {
    if (orderType === 'table') {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('table_order_items')
        .update(updateData)
        .eq('id', itemId);
      
      if (error) throw error;
    } else {
      // For delivery orders, update the order status
      const orderStatusMap: Record<string, string> = {
        'pending': 'pending',
        'preparing': 'preparing',
        'ready': 'delivery',
      };

      if (orderId) {
        const { error } = await supabase
          .from('orders')
          .update({ status: orderStatusMap[newStatus] || newStatus })
          .eq('id', orderId);
        
        if (error) throw error;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['kitchen-items'] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  return { updateItemStatus };
}

// Hook for waiter to see ready items
export function useWaiterReadyItems(waiterId?: string) {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['waiter-ready-items', waiterId],
    queryFn: async (): Promise<KitchenItem[]> => {
      // Use the RPC function filtered by 'ready' status
      const { data, error } = await supabase.rpc('get_kitchen_items', {
        _status_filter: 'ready',
      });

      if (error) {
        console.error('Error fetching waiter ready items:', error);
        throw error;
      }

      // Filter only table items for waiters
      return (data || [])
        .filter((item: any) => item.order_type === 'table')
        .map((item: any) => ({
          id: item.id,
          table_order_id: item.table_order_id,
          order_id: item.order_id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          observation: item.observation,
          unit_price: item.unit_price,
          status: item.status || 'ready',
          ordered_at: item.ordered_at || new Date().toISOString(),
          delivered_at: item.delivered_at,
          table_number: item.table_number,
          table_name: item.table_name,
          waiter_name: item.waiter_name,
          order_type: 'table' as const,
        }));
    },
    enabled: true,
    refetchInterval: 5000,
  });

  return { items, isLoading, error };
}
