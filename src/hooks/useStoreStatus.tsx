import { useStoreConfig } from './useStore';
import { useBusinessHours, isStoreCurrentlyOpen } from './useBusinessHours';

export interface StoreStatus {
  isOpen: boolean;
  reason: 'open' | 'forced_open' | 'manual_closed' | 'hours_closed';
  message: string;
}

/**
 * Hook que combina o status manual da loja (is_open) com os horários de funcionamento.
 * 
 * REGRAS:
 * 1. Se is_open = FALSE -> Loja FECHADA (fechamento manual tem prioridade máxima)
 * 2. Se is_open = TRUE e dentro do horário -> Loja ABERTA (operação normal)
 * 3. Se is_open = TRUE e fora do horário -> Loja ABERTA (forçando abertura)
 * 
 * O botão is_open funciona como um "master switch":
 * - Quando ATIVADO: mantém a loja aberta (força abertura se fora do horário)
 * - Quando DESATIVADO: fecha a loja independente do horário
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

  // Verificar status manual primeiro (prioridade máxima para FECHAR)
  if (!store.is_open) {
    return {
      isOpen: false,
      reason: 'manual_closed',
      message: 'Loja fechada temporariamente',
    };
  }

  // Se is_open = TRUE, a loja está ABERTA
  // Verificar se está dentro ou fora do horário para definir a razão
  const isWithinBusinessHours = businessHours 
    ? isStoreCurrentlyOpen(businessHours) 
    : true;

  if (isWithinBusinessHours) {
    // Operação normal dentro do horário
    return {
      isOpen: true,
      reason: 'open',
      message: 'Recebendo pedidos',
    };
  }

  // Fora do horário mas is_open = TRUE -> Forçando abertura
  return {
    isOpen: true,
    reason: 'forced_open',
    message: 'Forçando abertura',
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
