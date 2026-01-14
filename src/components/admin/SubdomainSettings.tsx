import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStoreConfig, useUpdateStoreConfig } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { Globe, Copy, Check, ExternalLink, Info, Loader2 } from 'lucide-react';

export function SubdomainSettings() {
  const { data: storeConfig } = useStoreConfig();
  const updateConfig = useUpdateStoreConfig();
  const { toast } = useToast();
  
  const [subdomain, setSubdomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (storeConfig?.subdomain_slug) {
      setSubdomain(storeConfig.subdomain_slug);
    }
  }, [storeConfig?.subdomain_slug]);

  const handleSubdomainChange = (value: string) => {
    // Limpar e validar em tempo real
    const cleanValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(cleanValue);
  };

  const handleSave = async () => {
    try {
      const updateData: any = {
        subdomain_slug: subdomain || null,
      };
      
      if (storeConfig?.id) {
        updateData.id = storeConfig.id;
      }
      
      await updateConfig.mutateAsync(updateData);
      toast({ title: 'Subdomínio salvo com sucesso!' });
    } catch (error) {
      toast({ 
        title: 'Erro ao salvar', 
        description: 'Não foi possível salvar o subdomínio.',
        variant: 'destructive' 
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    toast({ title: 'Copiado!' });
  };

  const fullDomain = subdomain ? `${subdomain}.infornexa.com.br` : '';
  const targetUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">URL do Cardápio</CardTitle>
        </div>
        <CardDescription>
          Configure o subdomínio para acesso ao seu cardápio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subdomain Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Subdomínio (opcional)</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center">
              <Input
                value={subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                placeholder="meucardapio"
                className="rounded-r-none"
              />
              <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground whitespace-nowrap">
                .infornexa.com.br
              </span>
            </div>
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : 'Salvar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use apenas letras minúsculas, números e hífens. Deixe vazio se não quiser usar subdomínio.
          </p>
        </div>

        {/* Preview URL */}
        {subdomain && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary">
                <ExternalLink className="h-3 w-3 mr-1" />
                URL do Cardápio
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-background px-3 py-2 rounded text-sm border">
                https://{fullDomain}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(`https://${fullDomain}`, 'url')}
              >
                {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* DNS Configuration Instructions */}
        {subdomain && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">Configuração de DNS</h4>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Para que o subdomínio funcione, adicione o seguinte registro no DNS do domínio <strong>infornexa.com.br</strong>:
            </p>

            <div className="bg-muted rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted-foreground/10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Nome</th>
                    <th className="px-3 py-2 text-left font-medium">Destino</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-muted-foreground/10">
                    <td className="px-3 py-2">
                      <Badge>CNAME</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>{subdomain}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(subdomain, 'name')}
                        >
                          {copied === 'name' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{targetUrl.replace('https://', '')}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(targetUrl.replace('https://', ''), 'target')}
                        >
                          {copied === 'target' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Acesse o painel de controle do seu provedor de DNS (Cloudflare, GoDaddy, Registro.br, etc.)</p>
              <p>• Adicione um registro CNAME apontando o subdomínio para o destino acima</p>
              <p>• A propagação pode levar de alguns minutos até 48 horas</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
