import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mediaUrl } from '@/lib/api';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function UserAvatar({ user, className, fallbackClassName }) {
  const src = mediaUrl(user?.profilePicture);
  return (
    <Avatar className={cn('size-10', className)}>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className={cn('bg-secondary font-medium text-secondary-foreground', fallbackClassName)}>
        {initials(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}
