import { useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { useSocket } from '@/context/socket.context';
import { timeLabel } from '@/hooks/use-playback';

export function TrackProgress({
  trackId,
  position,
  total,
  disabled,
}: {
  trackId?: string;
  position: number;
  total: number;
  disabled: boolean;
}) {
  const { send } = useSocket();
  const [draft, setDraft] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(null);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [trackId]);

  const commit = (value: number) => {
    if (!trackId || disabled) return;
    setDraft(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      send('seek', { trackId, positionMs: Math.min(value, Math.max(0, total - 1)) });
      timer.current = setTimeout(() => setDraft(null), 1500);
    }, 300);
  };

  return (
    <div className="flex w-full items-center gap-3 text-xs tabular-nums text-muted-foreground">
      <span className="w-10 text-right">{timeLabel(draft ?? position)}</span>
      <Slider
        aria-label="Playback position"
        value={[draft ?? position]}
        min={0}
        max={Math.max(1, total)}
        step={1000}
        disabled={disabled || !trackId || !total}
        onValueChange={([value]) => {
          setDraft(value);
          commit(value);
        }}
        onValueCommit={([value]) => commit(value)}
      />
      <span className="w-10">{total ? timeLabel(total) : 'Live'}</span>
    </div>
  );
}
