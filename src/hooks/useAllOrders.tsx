import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order } from './useOrders';

// Unified order type that includes both delivery and table orders
export interface UnifiedOrder {
  id: number;
  type: 'delivery' | 'table';
  customer_name: string;
  customer_phone: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_complement: string | null;
  address_reference: string | null;
  total_amount: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivery' | 'completed' | 'cancelled';
  payment_method: string | null;
  change_for: number | null;
  created_at: string;
  updated_at: string;
  // Table order specific
  table_id?: string | null;
  table_number?: number | null;
  table_name?: string | null;
  waiter_name?: string | null;
  customer_count?: number | null;
}

export interface UnifiedOrderItem {
  id: string;
  order_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  observation: string | null;
}

// Map table order status to unified status
function mapTableStatus(status: string): UnifiedOrder['status'] {
  switch (status) {
    case 'open':
      return 'pending'; // Changed from 'preparing' to 'pending' so dine-in orders appear in "Pendentes" column
    case 'requesting_bill':
      return 'ready';
    case 'paid':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

export function useAllOrders() {
  return useQuery({
    queryKey: ['all-orders'],
    queryFn: async () => {
      // Fetch delivery orders
      const { data: deliveryOrders, error: deliveryError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (deliveryError) throw deliveryError;

      // Fetch table orders with table info (specify FK to avoid ambiguity)
      const { data: tableOrders, error: tableError } = await supabase
        .from('table_orders')
        .select(`
          *,
          table:tables!table_orders_table_id_fkey(id, number, name)
        `)
        .in('status', ['open', 'requesting_bill'])
        .order('opened_at', { ascending: false });

      if (tableError) throw tableError;

      // Transform delivery orders
      const unifiedDelivery: UnifiedOrder[] = (deliveryOrders || []).map((order: any) => ({
        id: order.id,
        type: 'delivery' as const,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        address_street: order.address_street,
        address_number: order.address_number,
        address_neighborhood: order.address_neighborhood,
        address_complement: order.address_complement,
        address_reference: order.address_reference,
        total_amount: order.total_amount,
        status: order.status as UnifiedOrder['status'],
        payment_method: order.payment_method,
        change_for: order.change_for,
        created_at: order.created_at,
        updated_at: order.updated_at,
      }));

      // Transform table orders
      const unifiedTable: UnifiedOrder[] = (tableOrders || []).map((order: any) => ({
        id: order.id,
        type: 'table' as const,
        customer_name: order.table?.name 
          ? `Mesa ${order.table.number} - ${order.table.name}` 
          : `Mesa ${order.table?.number || '?'}`,
        customer_phone: null,
        address_street: null,
        address_number: null,
        address_neighborhood: null,
        address_complement: null,
        address_reference: null,
        total_amount: order.total_amount || 0,
        status: mapTableStatus(order.status),
        payment_method: order.payment_method,
        change_for: null,
        created_at: order.opened_at || order.created_at,
        updated_at: order.updated_at,
        table_id: order.table_id,
        table_number: order.table?.number,
        table_name: order.table?.name,
        waiter_name: order.waiter_name,
        customer_count: order.customer_count,
      }));

      // Combine and sort by creation date
      const allOrders = [...unifiedDelivery, ...unifiedTable].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return allOrders;
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });
}

export function useUnifiedOrderItems(orderId: number, orderType: 'delivery' | 'table') {
  return useQuery({
    queryKey: ['unified-order-items', orderId, orderType],
    queryFn: async () => {
      if (orderType === 'delivery') {
        const { data, error } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);
        
        if (error) throw error;
        return (data || []).map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          observation: item.observation,
        })) as UnifiedOrderItem[];
      } else {
        const { data, error } = await supabase
          .from('table_order_items')
          .select('*')
          .eq('table_order_id', orderId);
        
        if (error) throw error;
        return (data || []).map((item: any) => ({
          id: item.id,
          order_id: item.table_order_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          observation: item.observation,
        })) as UnifiedOrderItem[];
      }
    },
    enabled: !!orderId,
  });
}

export function useUpdateUnifiedOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      orderType 
    }: { 
      orderId: number; 
      status: UnifiedOrder['status']; 
      orderType: 'delivery' | 'table';
    }) => {
      if (orderType === 'delivery') {
        const { data, error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // For table orders, map unified status back to table status
        let tableStatus = 'open';
        if (status === 'completed') tableStatus = 'paid';
        else if (status === 'cancelled') tableStatus = 'cancelled';
        else if (status === 'ready') tableStatus = 'requesting_bill';
        else tableStatus = 'open';

        const { data, error } = await supabase
          .from('table_orders')
          .update({ status: tableStatus })
          .eq('id', orderId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-items'] });
    },
  });
}
