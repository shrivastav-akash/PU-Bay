import { useState } from 'react';
import { toast } from 'sonner';
import { Check, Clock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useData } from '@/context/session';
import { connectionStatus } from '@/lib/connections';
import { cn } from '@/lib/utils';

export default function ConnectButton({ userId, name, size = 'sm', compact = false, className }) {
  const { meId, sent, received, requests, sendRequest, respondRequest } = useData();
  const [busy, setBusy] = useState(false);

  if (requests.status === 'loading') return null;
  const status = connectionStatus(userId, { meId, sent, received });
  const first = name?.split(' ')[0] || 'them';

  const run = async (fn, done) => {
    setBusy(true);
    try {
      await fn();
      toast.success(done);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  switch (status.state) {
    case 'self':
      return null;
    case 'connected':
      return (
        <Button size={size} variant="secondary" disabled className={className}>
          <Check data-icon="inline-start" />
          Connected
        </Button>
      );
    case 'pending':
      return (
        <Button size={size} variant="outline" disabled className={className}>
          <Clock data-icon="inline-start" />
          Requested
        </Button>
      );
    case 'incoming':
      return (
        <div className={cn('flex gap-1.5', className)}>
          <Button size={size} disabled={busy} onClick={() => run(() => respondRequest(status.requestId, true), `You and ${first} are connected`)}>
            {busy ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" />}
            Accept
          </Button>
          {/* Compact spots (card headers, rail rows) only fit Accept; Ignore lives on the Network page. */}
          {!compact && (
            <Button size={size} variant="ghost" disabled={busy} onClick={() => run(() => respondRequest(status.requestId, false), 'Request ignored')}>
              Ignore
            </Button>
          )}
        </div>
      );
    default:
      return (
        <Button size={size} variant="outline" disabled={busy} className={className} onClick={() => run(() => sendRequest(userId), `Request sent to ${first}`)}>
          {busy ? <Spinner data-icon="inline-start" /> : <UserPlus data-icon="inline-start" />}
          Connect
        </Button>
      );
  }
}
