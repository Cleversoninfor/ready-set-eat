import { Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationToggleProps {
  variant?: 'switch' | 'button';
}

export function PushNotificationToggle({ variant = 'switch' }: PushNotificationToggleProps) {
  const { isSupported, isEnabled, permission, requestPermission } = usePushNotifications();

  if (!isSupported) return null;

  const handleToggle = async () => {
    console.log('[PushNotificationToggle] Toggle clicked, current state:', isEnabled);
    // Browser notifications can only be enabled by requesting permission.
    if (!isEnabled) {
      await requestPermission();
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant={isEnabled ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        className="gap-2"
        disabled={permission === 'denied'}
        title={
          permission === 'denied'
            ? 'Permissão negada. Ative nas configurações do navegador.'
            : isEnabled
              ? 'Notificações ativadas'
              : 'Ativar notificações'
        }
      >
        {isEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{isEnabled ? 'Notificações On' : 'Ativar Notificações'}</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
      {isEnabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
      <Switch
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={permission === 'denied'}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
