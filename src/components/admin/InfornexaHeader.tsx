import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoInfornexa from '@/assets/logo-infornexa-header.png';

export function InfornexaHeader() {
  const whatsappNumber = '5581996465310';
  const whatsappMessage = encodeURIComponent('Olá, preciso de suporte.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <header 
      className="w-full py-2 px-4"
      style={{ backgroundColor: '#23354D' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={logoInfornexa} 
            alt="Logo Infornexa" 
            className="h-10 w-auto"
          />
          <span className="text-white text-sm font-medium hidden sm:block">
            Meta na mente, cliente na frente.
          </span>
        </div>
        
        <Button
          asChild
          size="sm"
          className="bg-[#25D366] hover:bg-[#20BA5A] text-white gap-2"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            Suporte
          </a>
        </Button>
      </div>
    </header>
  );
}
