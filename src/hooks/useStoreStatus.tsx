import { useStoreConfig } from './useStore';
import { useBusinessHours, isStoreCurrentlyOpen } from './useBusinessHours';

export interface StoreStatus {
  isOpen: boolean;
  reason: 'open' | 'manual_closed' | 'hours_closed';
  message: string;
}

/**
 * Hook que combina o status manual da loja (is_open) com os horários de funcionamento.
 * A loja só está aberta se AMBAS as condições forem verdadeiras:
 * 1. O status manual (is_open) está ativado
 * 2. Está dentro do horário de funcionamento configurado
 * 
 * Esta é a regra de PRIORIDADE MÁXIMA para determinar se a loja aceita pedidos.
 */
export function useStoreStatus(): StoreStatus {
  const { data: store } = useStoreConfig();
  const { data: businessHours } = useBusinessHours();

  // Default: loja fechada se não tiver dados
  if (!store) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      message: 'Loja não configurada',
    };
  }

  // Verificar status manual primeiro (prioridade máxima)
  if (!store.is_open) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      message: 'Loja fechada temporariamente',
    };
  }

  // Verificar horário de funcionamento
  const isWithinBusinessHours = businessHours 
    ? isStoreCurrentlyOpen(businessHours) 
    : true; // Se não tem horários configurados, considera aberto

  if (!isWithinBusinessHours) {
    return {
      isOpen: false,
      reason: 'hours_closed',
      message: 'Fora do horário de funcionamento',
    };
  }

  // Ambas as condições satisfeitas
  return {
    isOpen: true,
    reason: 'open',
    message: 'Recebendo pedidos',
  };
}

/**
 * Hook simples que retorna apenas se a loja está aberta ou não.
 * Usa a mesma lógica combinada de status + horário.
 */
export function useIsStoreOpen(): boolean {
  const status = useStoreStatus();
  return status.isOpen;
}
