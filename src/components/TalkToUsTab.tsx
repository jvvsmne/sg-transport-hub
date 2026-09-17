import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, HeartHandshake, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

const DISQUS_SHORTNAME = 'sg-transport-hub';
const CANONICAL_PAGE_URL = 'https://sg-transport-hub.vercel.app/';
const PAGE_IDENTIFIER = 'sg-transport-hub-talk-to-us';
const PAGE_TITLE = 'Talk to Us';
const EMBED_SCRIPT_ID = 'disqus-embed-script';

export const TalkToUsTab: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    // Helper to configure Disqus parameters
    const configureDisqus = function (this: any) {
      this.page.url = CANONICAL_PAGE_URL;
      this.page.identifier = PAGE_IDENTIFIER;
      this.page.title = PAGE_TITLE;
    };

    const initOrReset = () => {
      if (isCancelled) return;

      const disqusWindow = window as any;

      // 1. If DISQUS global is already defined and loaded
      if (typeof disqusWindow.DISQUS !== 'undefined') {
        try {
          disqusWindow.DISQUS.reset({
            reload: true,
            config: configureDisqus,
          });
          if (!isCancelled) {
            setIsLoading(false);
          }
        } catch (err) {
          console.warn('[Disqus] Error during DISQUS.reset:', err);
        }
        return;
      }

      // 2. Set the global disqus_config for the first initialization
      disqusWindow.disqus_config = configureDisqus;

      // 3. Check if embed.js script is already in the document
      let script = document.getElementById(EMBED_SCRIPT_ID) as HTMLScriptElement | null;

      if (!script) {
        script = document.createElement('script');
        script.id = EMBED_SCRIPT_ID;
        script.src = `https://${DISQUS_SHORTNAME}.disqus.com/embed.js`;
        script.setAttribute('data-timestamp', String(+new Date()));
        script.async = true;

        script.onload = () => {
          if (!isCancelled) {
            setIsLoading(false);
          }
        };

        script.onerror = (e) => {
          console.error('[Disqus] Failed to load embed script:', e);
          if (!isCancelled) {
            setIsLoading(false);
          }
        };

        (document.head || document.body).appendChild(script);
      } else {
        // Script tag exists but DISQUS might still be in transit/loading
        const checkInterval = setInterval(() => {
          if (typeof disqusWindow.DISQUS !== 'undefined') {
            clearInterval(checkInterval);
            if (!isCancelled) {
              try {
                disqusWindow.DISQUS.reset({
                  reload: true,
                  config: configureDisqus,
                });
              } catch (err) {
                console.warn('[Disqus] Error in reset after script load:', err);
              }
              setIsLoading(false);
            }
          }
        }, 100);

        // Clear interval after 10 seconds to prevent leaking
        const timeout = setTimeout(() => {
          clearInterval(checkInterval);
          if (!isCancelled) setIsLoading(false);
        }, 10000);

        return () => {
          clearInterval(checkInterval);
          clearTimeout(timeout);
        };
      }
    };

    // Use requestAnimationFrame to ensure the container <div id="disqus_thread"> is mounted in DOM
    const rafId = requestAnimationFrame(() => {
      initOrReset();
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafId);
      // Clean up disqus_thread container inner HTML to avoid ghost state on remount
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                <MessageSquare className="w-3 h-3 text-purple-400" />
                Community &amp; Feedback
              </span>
              <span className="text-xs text-slate-400">• Open Discussions</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Talk to Us
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Have feedback, spotted a bus schedule anomaly, or have ideas to improve the transport hub? Join the conversation below.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Moderated Community</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Disqus Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Community Guidelines Pill Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
          <HeartHandshake className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">Be Respectful</span>
            Keep discussions constructive and courteous for all Singapore commuters.
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
          <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">Route Discrepancies</span>
            Report unexpected diversions, bus stop relocations, or timing delays.
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">Feature Requests</span>
            Suggest new commuter tools, crowd indicators, or map improvements.
          </div>
        </div>
      </div>

      {/* Disqus Embed Container Card */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl relative min-h-[420px]">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 rounded-2xl z-10 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-3" />
            <p className="text-sm text-slate-300 font-medium">Loading discussion thread...</p>
            <p className="text-xs text-slate-500 mt-1">Connecting to Disqus community</p>
          </div>
        )}

        {/* The required Disqus thread element */}
        <div ref={containerRef} id="disqus_thread" className="min-h-[380px]"></div>

        <noscript>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
            Please enable JavaScript to view the{' '}
            <a
              href="https://disqus.com/?ref_noscript"
              rel="nofollow noreferrer"
              className="text-emerald-400 underline font-semibold"
            >
              comments powered by Disqus.
            </a>
          </div>
        </noscript>
      </div>
    </div>
  );
};
