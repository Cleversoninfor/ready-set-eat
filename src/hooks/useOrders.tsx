import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_complement: string | null;
  address_reference: string | null;
  total_amount: number;
  status: 'pending' | 'preparing' | 'delivery' | 'completed' | 'cancelled';
  payment_method: 'money' | 'card' | 'pix';
  change_for: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  observation: string | null;
}

export interface CreateOrderData {
  customer_name: string;
  customer_phone: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_complement?: string | null;
  address_reference?: string | null;
  total_amount: number;
  payment_method: 'money' | 'card' | 'pix';
  change_for?: number | null;
}

export interface CreateOrderItemData {
  order_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  observation?: string | null;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrderItems(orderId: number) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (error) throw error;
      return data as OrderItem[];
    },
    enabled: !!orderId,
  });
}

export function useOrderWithItems(orderId: number) {
  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Order | null;
    },
    enabled: !!orderId,
  });

  const itemsQuery = useOrderItems(orderId);

  return {
    order: orderQuery.data,
    items: itemsQuery.data,
    isLoading: orderQuery.isLoading || itemsQuery.isLoading,
    error: orderQuery.error || itemsQuery.error,
  };
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ order, items }: { order: CreateOrderData; items: Omit<CreateOrderItemData, 'order_id'>[] }) => {
      // Create the order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          address_street: order.address_street,
          address_number: order.address_number,
          address_neighborhood: order.address_neighborhood,
          address_complement: order.address_complement || null,
          address_reference: order.address_reference || null,
          total_amount: order.total_amount,
          payment_method: order.payment_method,
          change_for: order.change_for || null,
          status: 'pending',
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: newOrder.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        observation: item.observation || null,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      return newOrder as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
