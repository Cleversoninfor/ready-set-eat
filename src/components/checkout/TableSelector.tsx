import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  number: number;
  name: string | null;
  capacity: number | null;
  status: string | null;
}

interface TableSelectorProps {
  selectedTableId: string | null;
  onTableSelect: (table: Table) => void;
}

export function TableSelector({ selectedTableId, onTableSelect }: TableSelectorProps) {
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['available-tables-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('id, number, name, capacity, status')
        .eq('status', 'available')
        .order('number', { ascending: true });

      if (error) throw error;
      return data as Table[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma mesa disponível no momento</p>
        <p className="text-sm text-muted-foreground mt-1">Por favor, aguarde ou procure um atendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Selecione sua mesa:</p>
      <div className="grid grid-cols-3 gap-3">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => onTableSelect(table)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
              selectedTableId === table.id
                ? "border-primary bg-primary/10 shadow-md"
                : "border-border bg-card hover:border-primary/50"
            )}
          >
            <span className={cn(
              "text-2xl font-bold",
              selectedTableId === table.id ? "text-primary" : "text-foreground"
            )}>
              {table.number}
            </span>
            {table.name && (
              <span className="text-xs text-muted-foreground mt-0.5 truncate max-w-full">
                {table.name}
              </span>
            )}
            {table.capacity && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{table.capacity}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
