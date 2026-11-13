import { useState } from 'react';
import { useSocketEvent } from '@/context/socket.context';
import { useSession } from '@/hooks/useSession';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';
import { ThemeToggle } from '@/components/theme/toggle-theme';
import { SearchBox } from './search-box';

export function Navbar() {
  const [session, setSession] = useSession();
  const [voice, setVoice] = useState<{ guildId: string; name: string | null } | null>(null);
  useSocketEvent('statistics', (data) =>
    setVoice((previous) =>
      session && data.guildId !== session.guildId
        ? previous
        : { guildId: data.guildId, name: data.voiceChannel?.name ?? null },
    ),
  );
  const voiceName = voice?.guildId === session?.guildId ? voice?.name : null;

  return (
    <header className="border-b bg-card/80">
      <nav
        aria-label="Current server and account"
        className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border">
            <AvatarImage src={session?.guildIcon ?? undefined} alt="" />
            <AvatarFallback className="rounded-xl font-semibold">{session?.guildAcronym ?? '…'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0" aria-live="polite">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Controlling server
            </p>
            <p className="max-w-[18rem] truncate text-lg font-semibold leading-tight" title={session?.guildName}>
              {session?.guildName ?? 'Connecting…'}
            </p>
            {session && (
              <p
                className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
                title={voiceName ?? undefined}
                aria-label={voiceName ? `Voice channel: ${voiceName}` : 'Not connected to voice'}
              >
                <SpeakerLoudIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="max-w-[18rem] truncate">{voiceName ?? 'Not connected to voice'}</span>
              </p>
            )}
          </div>
        </div>
        <SearchBox
          className="order-last w-full md:order-none md:max-w-sm md:flex-1"
          label="Search in current server"
          placeholder={session ? `Search in ${session.guildName}…` : 'Search a track…'}
        />
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto min-w-0 gap-2 px-2 py-1.5 text-left"
                  aria-label={`Account: ${session.displayName}`}
                >
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={session.avatar} alt="" />
                    <AvatarFallback>{session.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block max-w-36 truncate text-sm font-medium">{session.displayName}</span>
                    <span className="block max-w-36 truncate text-xs text-muted-foreground">@{session.username}</span>
                  </span>
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Signed in as {session.displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-1 px-2 py-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Controlling {session.guildName}</p>
                  <p>To control another server, open a /web link from that server.</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onSelect={() => setSession(null)}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
}
