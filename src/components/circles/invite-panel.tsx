import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { circleInviteLink } from "@/data/circles";
import type { LoadedCircle } from "@/data/types";

interface InvitePanelProps {
  circle: LoadedCircle;
}

/**
 * The invite secret lives in the URL fragment, so it never reaches a server.
 * Treat the link like a key: anyone holding it joins as a writer.
 */
export function InvitePanel({ circle }: InvitePanelProps) {
  const [link, setLink] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!link) return;
    void QRCode.toDataURL(link, { margin: 1, width: 320 }).then(setQr).catch(() => setQr(null));
  }, [link]);

  const create = () => setLink(circleInviteLink(circle));

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (!link) return;
    await navigator.share({ title: `Join ${circle.name}`, url: link });
  };

  if (!link) {
    return (
      <Button
        variant="ghost"
        onClick={create}
        className="stock stock-press active:stock-press-active h-11 w-full rounded-lg"
      >
        <QrCode /> Invite someone
      </Button>
    );
  }

  return (
    <div className="stock-flat flex flex-col items-center gap-3 rounded-xl p-4">
      {qr && (
        <img
          src={qr}
          alt={`QR code to join ${circle.name}`}
          className="size-40 rounded-xl bg-white p-2"
        />
      )}
      <p className="text-muted-foreground text-center text-xs">
        Anyone with this link can join and log habits. Share it like a key.
      </p>
      <div className="flex w-full gap-2">
        <Button
          variant="ghost"
          onClick={copy}
          className="stock stock-press active:stock-press-active h-10 flex-1 rounded-lg"
        >
          {copied ? <Check className="text-primary-strong" /> : <Copy />}
          {copied ? "Copied" : "Copy link"}
        </Button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            variant="ghost"
            onClick={share}
            className="stock stock-press active:stock-press-active h-10 flex-1 rounded-lg"
          >
            <Share2 /> Share
          </Button>
        )}
      </div>
    </div>
  );
}
