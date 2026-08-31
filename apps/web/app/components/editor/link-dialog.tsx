import { useEffect, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { appCatalog } from "~/content/app";
import { useCatalog } from "~/lib/locale";

/** Zengin metin editörlerinin ortak bağlantı girişi. Native `prompt` yerine
 * odak yönetimi ve mobilde tutarlı görünümü olan uygulama içi bir dialogdur. */
export function LinkDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (href: string) => void;
}) {
  const copy = useCatalog(appCatalog).editor.richText.linkDialog;
  const [href, setHref] = useState("");

  useEffect(() => {
    if (open) setHref("");
  }, [open]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = href.trim();
    if (!value) return;
    onSubmit(value);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-md rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <Input
            autoFocus
            type="text"
            inputMode="url"
            autoComplete="url"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            placeholder={copy.placeholder}
            aria-label={copy.title}
          />
          <DialogFooter className="mt-5">
            <DialogClose asChild>
              <Button type="button" variant="outline">{copy.cancel}</Button>
            </DialogClose>
            <Button type="submit" disabled={!href.trim()}>{copy.apply}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
