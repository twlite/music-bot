import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ActionIcon({
  children,
  name,
  onClick,
}: React.PropsWithChildren<{
  name: string;
  onClick: () => void;
}>) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger onClick={onClick}>{children}</TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}
