import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, ShieldAlert, Activity, Cpu, Zap, Lock, TerminalSquare, Github, Twitter } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const features = [
  { icon: ShieldAlert, title: "Auto-Obfuscation",    desc: "Military-grade Lua protection. Upload raw source, serve protected bytecode to your users automatically." },
  { icon: Activity,    title: "Real-time Telemetry", desc: "Monitor execution rates, error traces, and active instances across all your published games instantly." },
  { icon: Code2,       title: "Version Control",     desc: "Keep track of script updates, easily rollback changes, and manage active/inactive states remotely." },
  { icon: Cpu,         title: "High Performance",    desc: "Lightning fast content delivery ensures your scripts load instantly for all players globally." },
  { icon: Lock,        title: "Access Management",   desc: "Restrict script execution to specific JobIds, user tiers, or game instances with granular control." },
  { icon: TerminalSquare, title: "Developer API",    desc: "Integrate directly with your CI/CD pipeline using our REST API to automate your workflow completely." },
];

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-background/75 backdrop-blur-xl"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <TerminalSquare className="w-4 h-4 text-primary" />
            </div>
            <span className="font-mono font-bold text-lg tracking-tight">Xeioa</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            {["Features","Pricing","FAQ"].map(s => (
              <a key={s} href={`#${s.toLowerCase()}`} className="hover:text-foreground transition-colors duration-200">{s}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:block transition-colors">Log in</Link>
            <Button asChild size="sm" className="rounded-full font-medium text-sm h-8 px-4">
              <Link href="/dashboard">Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative pt-36 pb-28 lg:pt-52 lg:pb-36 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <div className="container mx-auto px-4 text-center relative z-10">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8 tracking-wide"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(-12px)", transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s" }}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Xeioa · Now in beta</span>
            </div>

            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.05]"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s" }}
            >
              <span className="bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                The Command Center<br />
                for Roblox Devs
              </span>
            </h1>

            <p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s" }}
            >
              Upload, obfuscate, and monitor your Luau scripts in real-time.
              Enterprise-grade telemetry and protection built for serious studios.
            </p>

            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.7s ease 0.48s, transform 0.7s ease 0.48s" }}
            >
              <Button asChild size="lg" className="rounded-full h-12 px-8 text-base shadow-[0_0_50px_-8px_var(--color-primary)] hover:shadow-[0_0_70px_-8px_var(--color-primary)] transition-shadow duration-300">
                <Link href="/dashboard">Start Building <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-transparent border-white/10 hover:bg-white/5 transition-colors">
                View Docs
              </Button>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-28 border-t border-white/5 relative">
          <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <FadeUp className="mb-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to scale</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Stop managing scripts in Discord DMs. Move to a professional workflow with built-in protection and analytics.
              </p>
            </FadeUp>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {features.map((f, i) => (
                <FadeUp key={i} delay={i * 80}>
                  <div className="h-full p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_var(--color-primary)] transition-all duration-300 group">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── Code Preview ── */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/8 blur-[100px] rounded-full pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
              <FadeUp className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">Built for the developer experience</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Xeioa integrates directly with your game using a lightweight loader.
                  One line of code gives you full telemetry and remote execution.
                </p>
                <ul className="space-y-3.5">
                  {["Zero-configuration setup", "Async loading prevents yield", "Automatic error catching", "Encrypted payload delivery"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </FadeUp>

              <FadeUp delay={150} className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute -inset-px bg-gradient-to-r from-primary/50 to-primary/20 rounded-2xl blur-sm opacity-40" />
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#080810] shadow-2xl">
                    <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/50">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                      </div>
                      <div className="mx-auto text-xs text-muted-foreground font-mono">Loader.server.lua</div>
                    </div>
                    <div className="p-6 overflow-x-auto">
                      <pre className="text-sm font-mono leading-loose">
                        <code className="text-blue-400">local</code><code className="text-foreground"> script = </code><code className="text-blue-400">loadstring</code><code className="text-foreground">(</code><br />
                        <code className="text-foreground">  game:HttpGet(</code><code className="text-green-400">"https://api.xeioa.io/load/KEY"</code><code className="text-foreground">)</code><br />
                        <code className="text-foreground">)()</code><br />
                        <br />
                        <code className="text-muted-foreground">-- Auto telemetry, ban checks, notifications</code><br />
                        <code className="text-muted-foreground">-- handled transparently by Xeioa.</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-28 border-t border-white/5 relative">
          <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
          <div className="container mx-auto px-4 relative">
            <FadeUp className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
              <p className="text-muted-foreground">Start for free, upgrade when you need more power.</p>
            </FadeUp>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { name: "Hobby",  price: "Free", desc: "Perfect for personal projects", features: ["5 Scripts", "10,000 Executions/mo", "Basic Obfuscation", "7-day Log Retention"] },
                { name: "Pro",    price: "$19",  desc: "For serious developers",        features: ["Unlimited Scripts", "1M Executions/mo", "Premium Obfuscation", "30-day Log Retention", "API Access"], highlighted: true },
                { name: "Studio", price: "$99",  desc: "For large game studios",        features: ["Unlimited Everything", "Custom Loader", "Priority Support", "SLA Guarantee", "White-label Analytics"] },
              ].map((tier, i) => (
                <FadeUp key={i} delay={i * 100}>
                  <div className={`h-full rounded-2xl p-8 border flex flex-col transition-all duration-300 ${tier.highlighted ? "border-primary/60 bg-primary/5 shadow-[0_0_40px_-10px_var(--color-primary)]" : "border-white/8 bg-card hover:border-white/15"} relative`}>
                    {tier.highlighted && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-1">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{tier.desc}</p>
                    <div className="mb-7">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.price !== "Free" && <span className="text-muted-foreground text-sm">/mo</span>}
                    </div>
                    <ul className="space-y-3.5 mb-8 flex-1">
                      {tier.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary shrink-0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button variant={tier.highlighted ? "default" : "outline"} className={`w-full ${tier.highlighted ? "shadow-[0_0_20px_-5px_var(--color-primary)]" : "border-white/10 hover:bg-white/5"}`}>
                      {tier.price === "Free" ? "Get Started" : "Upgrade"}
                    </Button>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-28 border-t border-white/5">
          <div className="container mx-auto px-4 max-w-3xl">
            <FadeUp className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">Everything you need to know about Xeioa.</p>
            </FadeUp>
            <FadeUp delay={100}>
              <Accordion type="single" collapsible className="w-full space-y-3">
                {[
                  { q: "How does the obfuscation work?",          a: "We use a custom, proprietary compiler tailored for Roblox's Luau variant. It applies control-flow flattening, string encryption, and anti-tamper mechanisms before generating secure bytecode." },
                  { q: "Can I use Xeioa in a production game?",   a: "Absolutely. Our infrastructure is hosted globally with 99.99% uptime. The loader caches results locally to ensure game performance is never impacted by network latency." },
                  { q: "What happens if the service goes down?",   a: "The Xeioa loader employs a robust caching and fallback system. If master servers are unreachable, your game will automatically execute the last successfully cached version of your scripts." },
                  { q: "Is there a limit on script file size?",    a: "Free tier allows up to 1MB per script. Pro and Studio tiers support up to 50MB per script, easily accommodating massive codebases." },
                ].map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-white/8 px-2 rounded-xl bg-card/50 hover:bg-card transition-colors">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline hover:text-primary transition-colors py-4">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-4">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeUp>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <TerminalSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-mono font-bold">Xeioa</span>
          </div>
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Xeioa. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
