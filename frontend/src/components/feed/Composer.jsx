import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/context/session';
import { api } from '@/lib/api';

export default function Composer({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
          <DialogDescription>Share an update with your campus. It lands at the top of everyone's feed.</DialogDescription>
        </DialogHeader>
        {/* Remounting on every open resets the draft without effect bookkeeping. */}
        {open && <ComposerForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ComposerForm({ onDone }) {
  const { token, me, posts, setFeedIndex } = useData();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [body, setBody] = useState('');
  const [media, setMedia] = useState(null); // { file, url }
  const [busy, setBusy] = useState(false);
  const first = me.data?.user?.name?.split(' ')[0];

  useEffect(() => () => media && URL.revokeObjectURL(media.url), [media]);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) setMedia({ file, url: URL.createObjectURL(file) });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const form = new FormData();
    form.append('body', body.trim());
    if (media) form.append('media', media.file);
    try {
      await api('/post', { method: 'POST', form, token });
      await posts.reload();
      setFeedIndex(0);
      toast.success('Posted to the feed');
      onDone();
      navigate('/feed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const video = media?.file.type.startsWith('video/');

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="composer-body">{first ? `What's new, ${first}?` : "What's new?"}</FieldLabel>
        <Textarea id="composer-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} className="min-h-32 resize-y" required autoFocus />
      </Field>

      {media && (
        <div className="relative overflow-hidden rounded-xl border bg-muted">
          {video ? (
            <video src={media.url} controls className="max-h-64 w-full object-contain" />
          ) : (
            <img src={media.url} alt="Selected attachment preview" className="max-h-64 w-full object-cover" />
          )}
          <Button type="button" size="icon-sm" variant="secondary" aria-label="Remove attachment" onClick={() => setMedia(null)} className="absolute top-2 right-2">
            <X />
          </Button>
        </div>
      )}

      <DialogFooter className="flex-row items-center justify-between sm:justify-between">
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={pick} className="sr-only" tabIndex={-1} aria-hidden="true" />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
          <ImagePlus data-icon="inline-start" />
          {media ? 'Replace media' : 'Add media'}
        </Button>
        <Button type="submit" disabled={busy || !body.trim()}>
          {busy && <Spinner data-icon="inline-start" />}
          Post
        </Button>
      </DialogFooter>
    </form>
  );
}
