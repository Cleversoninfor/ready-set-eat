import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoInfornexa from '@/assets/logo-infornexa-header.png';

export function InfornexaHeader() {
  const handleSupport = () => {
    const whatsappNumber = '5581996465310';
    const whatsappMessage = encodeURIComponent('Olá, preciso de suporte.');
    window.open(`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`, '_blank');
  };

  return (
    <header 
      className="w-full py-2 px-4"
      style={{ backgroundColor: '#23354D' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img 
            src={logoInfornexa} 
            alt="Logo Infornexa" 
            className="h-14 w-auto"
          />
          <span className="text-white text-sm font-medium hidden sm:block">
            O seu cardápio digital, Boas vendas
          </span>
        </div>
        
        <Button
          onClick={handleSupport}
          size="sm"
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Suporte
        </Button>
      </div>
    </header>
  );
}
