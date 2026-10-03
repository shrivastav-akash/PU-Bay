import { useState } from 'react';
import { AtSign, Mail, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Logo } from '@/components/brand/Logo';

const PRIVACY = [
  ['Secure authentication', 'Passwords are hashed with bcrypt and never stored in plain text. Sessions use temporary tokens.'],
  ['Data you control', 'We only store what you submit: profile, posts, comments and connections. No location or behavioural tracking.'],
  ['Yours to remove', 'Edit your profile or delete posts anytime. We never sell your data.'],
];

const CONTACT = [
  { href: 'mailto:shrivastav.work@gmail.com', icon: Mail, label: 'Email', value: 'shrivastav.work@gmail.com' },
  { href: 'https://www.linkedin.com/in/shrivastavakash/', icon: UserRound, label: 'LinkedIn', value: 'shrivastavakash', external: true },
  { href: 'https://x.com/_akashrivastav_', icon: AtSign, label: 'X', value: '@_akashrivastav_', external: true },
];

export default function SiteFooter() {
  const [open, setOpen] = useState(null); // 'privacy' | 'contact'
  const close = (o) => !o && setOpen(null);

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Logo className="text-base [&_svg]:size-5" />
          <span>© {new Date().getFullYear()} · A Presidency University student network</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setOpen('privacy')}>Privacy</Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen('contact')}>Contact</Button>
        </div>
      </div>

      <Dialog open={open === 'privacy'} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Privacy</DialogTitle>
            <DialogDescription>We keep it simple and transparent.</DialogDescription>
          </DialogHeader>
          <dl className="flex flex-col gap-4">
            {PRIVACY.map(([title, body]) => (
              <div key={title}>
                <dt className="text-sm font-medium">{title}</dt>
                <dd className="text-sm text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'contact'} onOpenChange={close}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Contact</DialogTitle>
            <DialogDescription>Questions, ideas or want to collaborate? Reach out.</DialogDescription>
          </DialogHeader>
          <ItemGroup>
            {CONTACT.map(({ href, icon: Icon, label, value, external }) => (
              <Item key={label} variant="outline" asChild>
                <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <ItemMedia variant="icon"><Icon /></ItemMedia>
                  <ItemContent>
                    <ItemDescription>{label}</ItemDescription>
                    <ItemTitle>{value}</ItemTitle>
                  </ItemContent>
                </a>
              </Item>
            ))}
          </ItemGroup>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
