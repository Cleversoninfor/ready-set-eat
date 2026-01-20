import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mantém a lista de pedidos do Admin sempre atualizada sem precisar recarregar a página.
 * Escuta INSERT/UPDATE nas tabelas de pedidos e invalida o cache do React Query.
 */
export function useOrdersRealtime(enabled: boolean = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);
}
