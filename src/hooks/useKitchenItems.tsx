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
    queryFn: async () => {
      // Get open table orders
      const { data: openTableOrders, error: ordersError } = await supabase
        .from('table_orders')
        .select('*, table:tables(*)')
        .in('status', ['open', 'requesting_bill']);
      
      if (ordersError) throw ordersError;

      // Get table order items
      const tableOrderIds = (openTableOrders || []).map(o => o.id);
      let transformedTableItems: KitchenItem[] = [];
      
      if (tableOrderIds.length > 0) {
        let tableItemsQuery = supabase
          .from('table_order_items')
          .select('*')
          .in('table_order_id', tableOrderIds);
        
        if (statusFilter) {
          tableItemsQuery = tableItemsQuery.eq('status', statusFilter);
        } else {
          tableItemsQuery = tableItemsQuery.in('status', ['pending', 'preparing', 'ready']);
        }
        
        const { data: tableItems, error: tableItemsError } = await tableItemsQuery;
        if (tableItemsError) throw tableItemsError;

        // Transform table order items
        transformedTableItems = (tableItems || []).map(item => {
          const order = openTableOrders?.find(o => o.id === item.table_order_id);
          const table = order?.table;
          return {
            id: item.id,
            table_order_id: item.table_order_id,
            order_id: null,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            observation: item.observation,
            unit_price: item.unit_price,
            status: item.status || 'pending',
            ordered_at: item.ordered_at || item.created_at || new Date().toISOString(),
            delivered_at: item.delivered_at,
            table_number: table?.number || null,
            table_name: table?.name || null,
            waiter_name: order?.waiter_name || null,
            order_type: 'table' as const,
          };
        });
      }

      // Get delivery orders that are pending/preparing
      const { data: activeDeliveryOrders, error: deliveryError } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing']);
      
      if (deliveryError) throw deliveryError;

      // Get delivery order items
      const deliveryOrderIds = (activeDeliveryOrders || []).map(o => o.id);
      let transformedDeliveryItems: KitchenItem[] = [];

      if (deliveryOrderIds.length > 0) {
        const { data: deliveryItems, error: deliveryItemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', deliveryOrderIds);
        
        if (deliveryItemsError) throw deliveryItemsError;

        // Map order status to kitchen status
        const mapOrderStatusToKitchenStatus = (orderStatus: string): string => {
          switch (orderStatus) {
            case 'pending':
              return 'pending';
            case 'preparing':
              return 'preparing';
            default:
              return 'pending';
          }
        };

        // Transform delivery order items
        transformedDeliveryItems = (deliveryItems || [])
          .map(item => {
            const order = activeDeliveryOrders?.find(o => o.id === item.order_id);
            const kitchenStatus = mapOrderStatusToKitchenStatus(order?.status || 'pending');
            
            // Apply status filter for delivery items
            if (statusFilter && kitchenStatus !== statusFilter) return null;
            if (!statusFilter && !['pending', 'preparing', 'ready'].includes(kitchenStatus)) return null;
            
            return {
              id: item.id,
              table_order_id: null,
              order_id: item.order_id,
              product_id: null,
              product_name: item.product_name,
              quantity: item.quantity,
              observation: item.observation,
              unit_price: item.unit_price,
              status: kitchenStatus,
              ordered_at: order?.created_at || new Date().toISOString(),
              delivered_at: null,
              table_number: null,
              table_name: null,
              waiter_name: null,
              order_type: 'delivery' as const,
              customer_name: order?.customer_name,
            };
          })
          .filter(Boolean) as KitchenItem[];
      }

      // Combine and sort by ordered_at
      const allItems = [...transformedTableItems, ...transformedDeliveryItems].sort((a, b) => 
        new Date(a.ordered_at).getTime() - new Date(b.ordered_at).getTime()
      );

      return allItems;
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
    queryFn: async () => {
      const { data: openTableOrders, error: ordersError } = await supabase
        .from('table_orders')
        .select('*, table:tables(*)')
        .in('status', ['open', 'requesting_bill']);
      
      if (ordersError) throw ordersError;

      const { data: readyItems, error: itemsError } = await supabase
        .from('table_order_items')
        .select('*')
        .in('table_order_id', openTableOrders?.map(o => o.id) || [])
        .eq('status', 'ready');
      
      if (itemsError) throw itemsError;

      return (readyItems || []).map(item => {
        const order = openTableOrders?.find(o => o.id === item.table_order_id);
        const table = order?.table;
        return {
          id: item.id,
          table_order_id: item.table_order_id,
          order_id: null,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          observation: item.observation,
          unit_price: item.unit_price,
          status: item.status || 'ready',
          ordered_at: item.ordered_at || item.created_at || new Date().toISOString(),
          delivered_at: item.delivered_at,
          table_number: table?.number || null,
          table_name: table?.name || null,
          waiter_name: order?.waiter_name || null,
          order_type: 'table' as const,
        };
      }) as KitchenItem[];
    },
    enabled: true,
  });

  return { items, isLoading, error };
}
