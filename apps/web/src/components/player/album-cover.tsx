import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function AlbumCover({
  icon,
  fallback,
  className,
}: {
  icon?: string;
  fallback?: string;
  className?: string;
}) {
  return (
    <Avatar className={cn('rounded-sm h-52 w-52 bg-muted', className)}>
      <AvatarImage className="object-cover" src={icon} alt={fallback} />
      <AvatarFallback>{fallback?.charAt(0) ?? 'N/A'}</AvatarFallback>
    </Avatar>
  );
}
