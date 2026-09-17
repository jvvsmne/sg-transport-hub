import React, { useEffect } from 'react';
import { MessageSquare, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';

interface TalkToUsTabProps {
  isActive?: boolean;
}

export const TalkToUsTab: React.FC<TalkToUsTabProps> = ({ isActive = true }) => {
  useEffect(() => {
    if (!isActive) return;

    // Real fixed values as configured for sg-transport-hub
    const PAGE_URL = 'https://sg-transport-hub.vercel.app/talk-to-us';
    const PAGE_IDENTIFIER = 'sg-transport-hub-talk-to-us';

    const loadOrResetDisqus = () => {
      // 1. Set global disqus_config with exact recommended configuration variables
      (window as any).disqus_config = function (this: any) {
        this.page.url = PAGE_URL;
        this.page.identifier = PAGE_IDENTIFIER;
      };

      // 2. If Disqus is already loaded on the page, reset the thread
      if (typeof (window as any).DISQUS !== 'undefined') {
        try {
          (window as any).DISQUS.reset({
            reload: true,
            config: function (this: any) {
              this.page.url = PAGE_URL;
              this.page.identifier = PAGE_IDENTIFIER;
            },
          });
          return;
        } catch (err) {
          console.warn('Disqus reset error:', err);
        }
      }

      // 3. If the script was not yet added, inject the exact embed.js script
      const existingScript = document.getElementById('disqus-embed-script');
      if (!existingScript) {
        const d = document;
        const s = d.createElement('script');
        s.id = 'disqus-embed-script';
        s.src = 'https://sg-transport-hub.disqus.com/embed.js';
        s.setAttribute('data-timestamp', String(+new Date()));
        s.async = true;
        (d.head || d.body).appendChild(s);
      }

      // 4. In SPA environments, poll until window.DISQUS is ready to ensure thread renders
      let checkCount = 0;
      const pollTimer = setInterval(() => {
        checkCount++;
        if (typeof (window as any).DISQUS !== 'undefined') {
          clearInterval(pollTimer);
          try {
            (window as any).DISQUS.reset({
              reload: true,
              config: function (this: any) {
                this.page.url = PAGE_URL;
                this.page.identifier = PAGE_IDENTIFIER;
              },
            });
          } catch (e) {
            // Already initialized or handling
          }
        } else if (checkCount > 40) {
          clearInterval(pollTimer);
        }
      }, 150);
    };

    // Ensure DOM container is mounted and visible
    const timer = setTimeout(loadOrResetDisqus, 80);

    return () => {
      clearTimeout(timer);
    };
  }, [isActive]);

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
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl">
        {/* The required Disqus thread element */}
        <div id="disqus_thread" className="min-h-[380px]"></div>

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
