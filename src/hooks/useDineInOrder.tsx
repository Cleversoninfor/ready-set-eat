import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DineInOrderData {
  tableId: string;
  customerName: string;
  customerPhone: string;
  existingOrderId?: number | null;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    observation?: string | null;
  }[];
}

export function useCreateDineInOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DineInOrderData) => {
      // Always create a new order - each checkout is a separate order
      const { data: order, error: orderError } = await supabase
        .from('table_orders')
        .insert({
          table_id: data.tableId,
          customer_count: 1,
          waiter_name: `Cliente: ${data.customerName}`,
          status: 'open',
          subtotal: 0,
          discount: 0,
          discount_type: 'value',
          service_fee_enabled: false,
          service_fee_percentage: 0,
          total_amount: 0,
          notes: `Tel: ${data.customerPhone}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add items to the order
      const itemsToInsert = data.items.map((item) => ({
        table_order_id: order.id,
        product_id: item.productId || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        observation: item.observation || null,
        status: 'pending',
      }));

      const { error: itemsError } = await supabase
        .from('table_order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Calculate and update totals
      const subtotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      const { error: updateError } = await supabase
        .from('table_orders')
        .update({ subtotal, total_amount: subtotal })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Update table status
      const { error: tableError } = await supabase
        .from('tables')
        .update({
          status: 'occupied',
          current_order_id: order.id,
        })
        .eq('id', data.tableId);

      if (tableError) throw tableError;

      return { id: order.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-with-orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables-for-dine-in'] });
      queryClient.invalidateQueries({ queryKey: ['available-tables-public'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-items'] });
      queryClient.invalidateQueries({ queryKey: ['all-orders'] });
      toast({
        title: '🎉 Pedido enviado!',
        description: 'Seu pedido foi recebido e está sendo preparado.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao enviar pedido',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
