import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Printer, Copy, Loader2 } from 'lucide-react';
import { printReceipt, generatePrintableText, PrintOrderData } from '@/utils/thermalPrinter';

interface PrintReceiptButtonProps {
  orderData: PrintOrderData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function PrintReceiptButton({ orderData, variant = 'outline', size = 'default', className }: PrintReceiptButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const isSerialAvailable = () => {
    try {
      // Check if we're in an iframe (like Lovable preview)
      if (window.self !== window.top) {
        return false;
      }
      return 'serial' in navigator;
    } catch {
      return false;
    }
  };

  const handlePrint = () => {
    // Go directly to browser print - skip Web Serial API
    handleBrowserPrint();
  };

  const handleCopy = () => {
    const text = generatePrintableText(orderData);
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado para a área de transferência!' });
  };

  const handleBrowserPrint = () => {
    const text = generatePrintableText(orderData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comanda #${orderData.orderNumber}</title>
            <style>
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px; 
                white-space: pre;
                padding: 20px;
              }
              @media print {
                body { margin: 0; padding: 10px; }
              }
            </style>
          </head>
          <body>${text}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handlePrint}
        disabled={isPrinting}
        className={className}
      >
        {isPrinting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Printer className="w-4 h-4" />
        )}
        {size !== 'icon' && <span className="ml-2">Imprimir</span>}
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Visualização da Comanda</DialogTitle>
            <DialogDescription>
              Copie o texto ou use a impressão do navegador.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-auto max-h-96 whitespace-pre">
            {generatePrintableText(orderData)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopy} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copiar
            </Button>
            <Button onClick={handleBrowserPrint} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
