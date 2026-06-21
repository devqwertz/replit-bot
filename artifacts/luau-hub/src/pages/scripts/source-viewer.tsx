import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Copy, Check, Code2, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  scriptId: string;
  type: "source" | "obfuscated";
}

export default function SourceViewer({ scriptId, type }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const endpoint = type === "source"
    ? `/api/scripts/${scriptId}/source`
    : `/api/scripts/${scriptId}/obfuscated`;

  const label = type === "source" ? "Source Code" : "Obfuscated Code";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCode(null);
    setError(null);

    fetch(endpoint)
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 401 || r.status === 403) {
          setError("Access denied. You must be the script owner to view this.");
          return;
        }
        if (r.status === 404) {
          setError(type === "source"
            ? "No source code uploaded for this script."
            : "No obfuscated build available. Generate a key first.");
          return;
        }
        if (!r.ok) {
          setError("Failed to load code.");
          return;
        }
        const text = await r.text();
        if (!cancelled) setCode(text);
      })
      .catch(() => { if (!cancelled) setError("Network error. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [endpoint]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lineCount = code ? code.split("\n").length : 0;
  const byteSize = code ? new Blob([code]).size : 0;
  const sizeLabel = byteSize >= 1024
    ? `${(byteSize / 1024).toFixed(1)} KB`
    : `${byteSize} B`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-black/40 px-4 py-3 flex items-center gap-3 shrink-0">
        <Link
          href={`/scripts/${scriptId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Script
        </Link>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex items-center gap-2 text-sm font-mono">
          <Code2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">{label}</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {code && !loading && (
            <span className="text-[11px] text-muted-foreground/50 font-mono">
              {lineCount.toLocaleString()} lines · {sizeLabel}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
            <Lock className="w-3 h-3" />
            Owner only
          </div>
          {code && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-3 text-xs border-white/10 gap-1.5"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy all"}
            </Button>
          )}
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${50 + Math.random() * 50}%` }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-4">
            <AlertTriangle className="w-8 h-8 text-amber-500/70" />
            <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
            <Link href={`/scripts/${scriptId}`}>
              <Button size="sm" variant="outline" className="border-white/10 text-xs">
                Return to Script
              </Button>
            </Link>
          </div>
        ) : code ? (
          <div className="flex">
            {/* Line numbers */}
            <div className="select-none shrink-0 text-right pr-4 pl-4 py-4 font-mono text-xs text-muted-foreground/25 border-r border-white/5 bg-black/20 leading-5">
              {code.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            {/* Code */}
            <pre className="flex-1 p-4 font-mono text-xs text-green-300/90 leading-5 whitespace-pre overflow-x-auto">
              {code}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
