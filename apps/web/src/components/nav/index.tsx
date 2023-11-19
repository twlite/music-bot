import { useSession } from '@/hooks/useSession';
import { Avatar, AvatarImage } from '../ui/avatar';
import { AvatarFallback } from '@radix-ui/react-avatar';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '../ui/input';
import { ThemeToggle } from '../theme/toggle-theme';

export function Navbar() {
  const [session, setSession] = useSession();
  if (!session) return null;

  return (
    <nav className="flex items-center justify-between px-5 py-3 border-b">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={session.guildIcon!} alt={session.guildName} />
          <AvatarFallback>{session.guildAcronym}</AvatarFallback>
        </Avatar>
        <span className="font-semibold">{session.guildName}</span>
      </div>
      <div className="relative flex items-center w-1/3">
        <MagnifyingGlassIcon className="absolute left-3" />
        <Input className="pl-8" placeholder="Search a track" />
      </div>
      <div className="inline-flex gap-2">
        <ThemeToggle />
        <ProfileDropdown session={session} setSession={setSession} />
      </div>
    </nav>
  );
}

function ProfileDropdown({
  session,
  setSession,
}: {
  session: ReturnType<typeof useSession>[0] & {};
  setSession: ReturnType<typeof useSession>[1];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={session.avatar!} alt={session.displayName} />
          <AvatarFallback>{session.displayName[0]}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>@{session.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-500"
          onClick={() => {
            setSession(null);
          }}
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
