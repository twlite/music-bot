import { ArrowLeftIcon } from '@radix-ui/react-icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BAND_COUNT,
  EqualizerBand,
  EqualizerConfigurationPreset,
} from '@/lib/equalizer';
import { useSocket, useSocketEvent } from '@/context/socket.context';
import { useEffect, useState } from 'react';
import { Slider } from '../ui/slider';
import { Separator } from '../ui/separator';

type PresetName = keyof typeof EqualizerConfigurationPreset;

const presetMap = Object.keys(EqualizerConfigurationPreset) as PresetName[];

function DefaultPresets() {
  const { send } = useSocket();

  return (
    <Select
      defaultValue="default"
      onValueChange={(selection) => {
        const preset = EqualizerConfigurationPreset[selection as PresetName];
        if (!preset) return;
        send('equalizer', preset);
      }}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a preset" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Select</SelectItem>
        {presetMap.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Equalizer({ onClose }: { onClose: () => void }) {
  const { send } = useSocket();
  const [bands, setBands] = useState<EqualizerBand[]>(
    EqualizerConfigurationPreset.Flat
  );

  useSocketEvent('equalizer', (bands) => {
    setBands(bands);
  });

  useSocketEvent('statistics', (data) => {
    setBands(data.equalizer || EqualizerConfigurationPreset.Flat);
  });

  return (
    <div className="container py-4">
      <div className="flex items-center gap-4">
        <ArrowLeftIcon className="h-5 w-5 cursor-pointer" onClick={onClose} />
        <h3 className="font-medium text-base">Equalizer settings</h3>
      </div>
      <div className="p-4">
        <div className="flex items-end gap-2">
          <h4 className="text-sm mb-2 text-muted-foreground">Presets</h4>
          <DefaultPresets />
        </div>
        <div className="flex justify-between w-full p-8 bg-secondary/30 rounded-lg mt-4 relative">
          <span className="text-muted-foreground text-xs absolute top-6 left-2 z-10">
            0.25
          </span>
          <span className="text-muted-foreground text-xs absolute top-[45%] left-2 z-10">
            0
          </span>
          <span className="text-muted-foreground text-xs absolute bottom-12 left-2 z-10">
            -0.25
          </span>
          <Separator className="w-[92%] absolute top-[47.5%] left-12" />
          <div className="flex justify-between w-full px-4">
            {Array.from(
              {
                length: BAND_COUNT,
              },
              (_, i) => {
                return (
                  <div key={i} className="flex flex-col items-center">
                    <Slider
                      defaultValue={[0]}
                      min={-0.25}
                      max={0.25}
                      step={0.01}
                      orientation="vertical"
                      className="flex-col h-[300px] w-[7px]"
                      value={[bands[i]?.gain ?? 0]}
                      onValueChange={(e) => {
                        const config = { band: i, gain: e[0] };
                        const newBands = bands.map((b) =>
                          b.band === i ? config : b
                        );

                        setBands(newBands);
                      }}
                      onValueCommit={(e) => {
                        const config = { band: i, gain: e[0] };
                        const newBands = bands.map((b) =>
                          b.band === i ? config : b
                        );

                        send('equalizer', newBands);
                      }}
                    />
                    <span className="text-muted-foreground text-sm">
                      Band {i + 1}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
