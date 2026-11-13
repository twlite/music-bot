import { useEffect, useState } from 'react';
import { EqualizerConfigurationPreset, type EqualizerBand, type IStatistics } from '@music-bot/shared';
import { useSocket } from '@/context/socket.context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const frequencies = [
  '25',
  '40',
  '63',
  '100',
  '160',
  '250',
  '400',
  '630',
  '1k',
  '1.6k',
  '2.5k',
  '4k',
  '6.3k',
  '10k',
  '16k',
];

export function Equalizer({ state }: { state: IStatistics | null }) {
  const { send } = useSocket();
  const [bands, setBands] = useState<EqualizerBand[]>(EqualizerConfigurationPreset.Flat);
  useEffect(() => {
    if (state?.equalizer) setBands(state.equalizer);
  }, [state?.equalizer]);
  const disabled = !state?.connected;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Equalizer</CardTitle>
            <CardDescription className="mt-2">Shape your sound with 15 bands or choose a preset.</CardDescription>
          </div>
          <Select
            value={state?.equalizerPreset ?? 'Flat'}
            disabled={disabled}
            onValueChange={(name) => {
              const preset = EqualizerConfigurationPreset[name as keyof typeof EqualizerConfigurationPreset];
              if (preset) {
                setBands(preset);
                send('equalizer', preset);
              }
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom" disabled>
                Custom
              </SelectItem>
              {Object.keys(EqualizerConfigurationPreset).map((name) => (
                <SelectItem key={name} value={name}>
                  {name.replace(/([a-z])([A-Z])/g, '$1 $2')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-x-5 gap-y-6 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
            {bands.map((band, i) => (
              <div key={i} className="flex min-w-0 flex-col items-center gap-3">
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {band.gain > 0 ? '+' : ''}
                  {band.gain.toFixed(2)}
                </span>
                <Slider
                  aria-label={`${frequencies[i]} Hz equalizer gain`}
                  orientation="vertical"
                  className="h-28 w-5 flex-col [&>span:first-child]:h-full [&>span:first-child]:w-1.5 [&>span:first-child>span]:w-full"
                  min={-0.25}
                  max={1}
                  step={0.01}
                  disabled={disabled}
                  value={[band.gain]}
                  onValueChange={([gain]) =>
                    setBands((previous) => previous.map((b) => (b.band === i ? { band: i, gain } : b)))
                  }
                  onValueCommit={([gain]) =>
                    send(
                      'equalizer',
                      bands.map((b) => (b.band === i ? { band: i, gain } : b)),
                    )
                  }
                />
                <span className="text-[10px] text-muted-foreground">{frequencies[i]} Hz</span>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-5"
            disabled={disabled}
            onClick={() => send('equalizer', EqualizerConfigurationPreset.Flat)}
          >
            Reset equalizer
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>Audio effects</CardTitle>
            <Badge variant="secondary">{state?.effects.length ?? 0} active</Badge>
          </div>
          <CardDescription>Mix multiple effects. Equalizer settings stay active alongside them.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {state?.effectPresets.map((effect) => (
            <label
              key={effect.name}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
            >
              {effect.label}
              <Switch
                aria-label={effect.label}
                disabled={disabled}
                checked={state.effects.includes(effect.name)}
                onCheckedChange={(enabled) => send('effect', { name: effect.name, enabled })}
              />
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
