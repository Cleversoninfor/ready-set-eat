import { useState, useEffect } from 'react';
import { Globe, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStoreConfig, useUpdateStoreConfig } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DomainSettings() {
  const { data: store } = useStoreConfig();
  const updateStore = useUpdateStoreConfig();
  const { toast } = useToast();
  
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      setSubdomain((store as any).subdomain_slug || '');
      setCustomDomain((store as any).custom_domain || '');
    }
  }, [store]);

  const handleSave = async () => {
    if (!store?.id) return;

    try {
      await updateStore.mutateAsync({
        id: store.id,
        subdomain_slug: subdomain || null,
        custom_domain: customDomain || null,
      } as any);
      
      toast({
        title: 'Domínio salvo!',
        description: 'Configure o DNS conforme as instruções abaixo.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copiado!' });
  };

  const fullSubdomain = subdomain ? `${subdomain}.infornexa.com.br` : '';
  const lovableAppUrl = 'ready-set-eat.lovable.app';
  const lovableIP = '185.158.133.1';

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm sm:text-base">
        <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        URL Personalizada do Cardápio
      </h3>

      <div className="space-y-4">
        {/* Subdomain Configuration */}
        <div>
          <label className="text-xs sm:text-sm text-muted-foreground">
            Subdomínio (infornexa.com.br)
          </label>
          <div className="flex gap-2 mt-1">
            <Input
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="cardapio"
              className="flex-1"
            />
            <span className="flex items-center text-sm text-muted-foreground">.infornexa.com.br</span>
          </div>
          {subdomain && (
            <p className="text-xs text-muted-foreground mt-1">
              URL final: <span className="text-primary font-medium">{fullSubdomain}</span>
            </p>
          )}
        </div>

        {/* Custom Domain (Optional) */}
        <div>
          <label className="text-xs sm:text-sm text-muted-foreground">
            Domínio Personalizado (opcional)
          </label>
          <Input
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
            placeholder="cardapio.seudominio.com.br"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use se quiser um domínio completamente personalizado
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateStore.isPending} className="w-full">
          {updateStore.isPending ? 'Salvando...' : 'Salvar Configurações de Domínio'}
        </Button>
      </div>

      {/* DNS Configuration Instructions */}
      {(subdomain || customDomain) && (
        <div className="border-t pt-4 mt-4 space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Configuração de DNS Necessária
          </h4>

          <Alert>
            <AlertDescription className="text-sm">
              Para que o domínio funcione, você precisa configurar os registros DNS no painel do seu provedor de domínio.
            </AlertDescription>
          </Alert>

          {/* For subdomain of infornexa.com.br */}
          {subdomain && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Para: {fullSubdomain}</p>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Opção 1: Registro CNAME (Recomendado)</p>
                <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded p-2">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-mono font-medium">CNAME</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-mono font-medium">{subdomain}</p>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-muted-foreground">Valor:</span>
                      <p className="font-mono font-medium text-[10px] break-all">{lovableAppUrl}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(lovableAppUrl, 'cname')}
                    >
                      {copied === 'cname' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Opção 2: Registro A</p>
                <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded p-2">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-mono font-medium">A</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-mono font-medium">{subdomain}</p>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-muted-foreground">IP:</span>
                      <p className="font-mono font-medium">{lovableIP}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(lovableIP, 'a-record')}
                    >
                      {copied === 'a-record' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* For custom domain */}
          {customDomain && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Para: {customDomain}</p>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Registro A</p>
                <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded p-2">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-mono font-medium">A</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-mono font-medium">@</p>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-muted-foreground">IP:</span>
                      <p className="font-mono font-medium">{lovableIP}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(lovableIP, 'custom-a')}
                    >
                      {copied === 'custom-a' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Registro TXT (Verificação)</p>
                <div className="grid grid-cols-3 gap-2 text-xs bg-background rounded p-2">
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-mono font-medium">TXT</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-mono font-medium">_lovable</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-mono font-medium text-[10px]">Configurar no Lovable</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>⏱️ A propagação do DNS pode levar até 48 horas.</p>
            <p>🔒 O SSL será configurado automaticamente após a verificação.</p>
          </div>

          <Button variant="outline" size="sm" asChild className="w-full">
            <a href="https://docs.lovable.dev/features/custom-domain" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver documentação completa
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
