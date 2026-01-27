import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Printer, FileDown, Loader2 } from 'lucide-react';
import { useStoreConfig } from '@/hooks/useStore';
import { TableOrderItem } from '@/types/pdv';

interface CheckoutPrintButtonProps {
  tableName: string;
  items: TableOrderItem[];
  subtotal: number;
  discountAmount: number;
  serviceFeeEnabled: boolean;
  serviceFee: number;
  total: number;
  className?: string;
}

export function CheckoutPrintButton({
  tableName,
  items,
  subtotal,
  discountAmount,
  serviceFeeEnabled,
  serviceFee,
  total,
  className,
}: CheckoutPrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { data: storeConfig } = useStoreConfig();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const generateReceiptText = (storeName: string) => {
    const width = 32;
    let text = '';

    const centerText = (str: string): string => {
      const padding = Math.max(0, Math.floor((width - str.length) / 2));
      return ' '.repeat(padding) + str;
    };

    const formatLine = (left: string, right: string): string => {
      const rightLen = right.length;
      const leftLen = width - rightLen - 1;
      return left.substring(0, leftLen).padEnd(leftLen, ' ') + ' ' + right;
    };

    // Header with store name
    text += centerText(storeName.toUpperCase()) + '\n';
    text += centerText('CONTA') + '\n';
    text += centerText(tableName.toUpperCase()) + '\n';
    text += '-'.repeat(width) + '\n';

    // Date/time
    const now = new Date();
    text += `Data: ${now.toLocaleDateString('pt-BR')}\n`;
    text += `Hora: ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
    text += '-'.repeat(width) + '\n';

    // Items
    text += 'ITENS DO PEDIDO\n';
    text += '-'.repeat(width) + '\n';

    const activeItems = items.filter(i => i.status !== 'cancelled');
    activeItems.forEach((item, index) => {
      const itemTotal = item.quantity * Number(item.unit_price);
      text += formatLine(`${item.quantity}x ${item.product_name}`, formatCurrency(itemTotal)) + '\n';

      if (item.observation) {
        text += `  Obs: ${item.observation}\n`;
      }

      if (index < activeItems.length - 1) {
        text += '----\n';
      }
    });

    text += '-'.repeat(width) + '\n';

    // Total items
    const totalQuantity = activeItems.reduce((sum, item) => sum + item.quantity, 0);
    text += `Qtd Total de Itens: ${totalQuantity}\n`;
    text += '-'.repeat(width) + '\n';

    // Subtotal
    text += formatLine('Subtotal:', formatCurrency(subtotal)) + '\n';

    // Discount
    if (discountAmount > 0) {
      text += formatLine('Desconto:', `-${formatCurrency(discountAmount)}`) + '\n';
    }

    // Service fee
    if (serviceFeeEnabled && serviceFee > 0) {
      text += formatLine('Taxa de Servico (10%):', formatCurrency(serviceFee)) + '\n';
    }

    text += '='.repeat(width) + '\n';
    text += formatLine('TOTAL:', formatCurrency(total)) + '\n';
    text += '='.repeat(width) + '\n';

    // Footer
    text += '-'.repeat(width) + '\n';
    text += centerText('Obrigado pela preferencia!') + '\n';

    return text;
  };

  const handleThermalPrint = async () => {
    const activeItems = items.filter(i => i.status !== 'cancelled');
    if (activeItems.length === 0) {
      toast({ title: 'Nenhum item para imprimir', variant: 'destructive' });
      return;
    }

    try {
      setIsPrinting(true);
      const storeName = storeConfig?.name || 'Restaurante';
      const text = generateReceiptText(storeName);

      const lines = text.split('\n');
      const lineHeight = 14;
      const paddingVertical = 20;
      const dynamicHeight = lines.length * lineHeight + paddingVertical;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Conta ${tableName}</title>
              <style>
                @page { 
                  size: 80mm ${dynamicHeight}px; 
                  margin: 0; 
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body { 
                  width: 80mm;
                  height: ${dynamicHeight}px;
                  margin: 0;
                  padding: 0;
                }
                body { 
                  font-family: 'Courier New', monospace; 
                  font-size: 12px; 
                  line-height: ${lineHeight}px;
                  white-space: pre;
                  padding: 10px;
                }
                @media print {
                  html, body {
                    width: 80mm;
                    height: auto;
                  }
                  body { 
                    margin: 0; 
                    padding: 10px; 
                  }
                }
              </style>
            </head>
            <body>${text}</body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({ title: 'Erro ao imprimir', variant: 'destructive' });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportPDF = async () => {
    const activeItems = items.filter(i => i.status !== 'cancelled');
    if (activeItems.length === 0) {
      toast({ title: 'Nenhum item para exportar', variant: 'destructive' });
      return;
    }

    try {
      setIsExporting(true);
      const jsPDF = (await import('jspdf')).default;
      const storeName = storeConfig?.name || 'Restaurante';

      // Calculate dynamic height
      const pageWidth = 80; // mm
      const margin = 5;
      const lineHeight = 4;
      let estimatedHeight = 35; // Header

      estimatedHeight += activeItems.length * lineHeight * 2; // Items
      activeItems.forEach(item => {
        if (item.observation) estimatedHeight += lineHeight;
      });
      estimatedHeight += 50; // Footer, totals, service fee, discount

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pageWidth, Math.max(estimatedHeight, 100)],
      });

      let y = margin;

      // Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(storeName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 5;

      doc.setFontSize(10);
      doc.text('CONTA', pageWidth / 2, y, { align: 'center' });
      y += 4;
      doc.text(tableName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 5;

      // Date
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const now = new Date();
      doc.text(
        `Data: ${now.toLocaleDateString('pt-BR')} - ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        margin,
        y
      );
      y += 5;

      // Items header
      doc.setFont('helvetica', 'bold');
      doc.text('ITENS DO PEDIDO', margin, y);
      y += 4;
      doc.line(margin, y, pageWidth - margin, y);
      y += 3;

      // Items
      doc.setFont('helvetica', 'normal');
      activeItems.forEach(item => {
        const itemTotal = item.quantity * Number(item.unit_price);

        doc.text(`${item.quantity}x ${item.product_name}`, margin, y);
        doc.text(formatCurrency(itemTotal), pageWidth - margin, y, { align: 'right' });
        y += 4;

        if (item.observation) {
          doc.setFontSize(7);
          doc.text(`  Obs: ${item.observation}`, margin, y);
          y += 3;
          doc.setFontSize(8);
        }
      });

      y += 2;
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;

      // Total items
      const totalQuantity = activeItems.reduce((sum, item) => sum + item.quantity, 0);
      doc.text(`Qtd Total de Itens: ${totalQuantity}`, margin, y);
      y += 5;

      doc.line(margin, y, pageWidth - margin, y);
      y += 4;

      // Subtotal
      doc.text('Subtotal:', margin, y);
      doc.text(formatCurrency(subtotal), pageWidth - margin, y, { align: 'right' });
      y += 4;

      // Discount
      if (discountAmount > 0) {
        doc.text('Desconto:', margin, y);
        doc.text(`-${formatCurrency(discountAmount)}`, pageWidth - margin, y, { align: 'right' });
        y += 4;
      }

      // Service fee
      if (serviceFeeEnabled && serviceFee > 0) {
        doc.text('Taxa de Serviço (10%):', margin, y);
        doc.text(formatCurrency(serviceFee), pageWidth - margin, y, { align: 'right' });
        y += 4;
      }

      y += 2;

      // Total
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TOTAL:', margin, y);
      doc.text(formatCurrency(total), pageWidth - margin, y, { align: 'right' });
      y += 6;

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Obrigado pela preferência!', pageWidth / 2, y, { align: 'center' });

      doc.save(`conta-${tableName.replace(/\s/g, '-')}.pdf`);
      toast({ title: 'PDF exportado com sucesso!' });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button variant="outline" size="sm" onClick={handleThermalPrint} disabled={isPrinting}>
        {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
        <span className="ml-2">Imprimir (Térmica)</span>
      </Button>

      <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExporting}>
        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        <span className="ml-2">Exportar PDF</span>
      </Button>
    </div>
  );
}
