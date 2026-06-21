import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FileCode2, Activity, ShieldBan, LogOut,
  Sun, Moon, Leaf, Heart, Monitor, Palette, Check, LayoutGrid,
  Wrench, List, KeyRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useClerk } from "@clerk/react";
import { useTheme, THEMES, type Theme } from "@/hooks/use-theme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    title: "Key System",
    items: [
      { href: "/services",     label: "Services",     icon: LayoutGrid },
      { href: "/integrations", label: "Integrations", icon: Wrench },
      { href: "/providers",    label: "Providers",    icon: List },
      { href: "/keys",         label: "Keys",         icon: KeyRound },
    ],
  },
  {
    title: "Scripts",
    items: [
      { href: "/scripts", label: "Lua Scripts",   icon: FileCode2 },
      { href: "/logs",    label: "Logs",          icon: Activity },
      { href: "/bans",    label: "Bans",          icon: ShieldBan },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function ThemeIcon({ id }: { id: Theme }) {
  const cls = "w-3.5 h-3.5";
  if (id === "light")       return <Sun className={cls} />;
  if (id === "dark-green")  return <Leaf className={cls} />;
  if (id === "dark-pink")   return <Heart className={cls} />;
  if (id === "system")      return <Monitor className={cls} />;
  return <Moon className={cls} />;
}

function ThemeDot({ id }: { id: Theme }) {
  const colors: Record<Theme, string> = {
    "light":       "bg-white border border-gray-300",
    "dark-blue":   "bg-indigo-500",
    "dark-red":    "bg-red-500",
    "dark":        "bg-neutral-500",
    "dark-orange": "bg-orange-500",
    "dark-green":  "bg-green-500",
    "dark-pink":   "bg-pink-500",
    "system":      "bg-gradient-to-br from-indigo-500 to-gray-700",
  };
  return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[id]}`} />;
}

function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Palette className="w-4 h-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 px-3 py-2 h-auto text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md">
            <Palette className="w-4 h-4" />
            <span className="text-sm">Theme</span>
            <ThemeDot id={theme} />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "right"} className="w-52 bg-card border-border">
        <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest px-3 py-1.5">Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-muted/60"
          >
            <ThemeDot id={t.id} />
            <ThemeIcon id={t.id} />
            <span className="flex-1 text-sm">{t.label}</span>
            {theme === t.id && <Check className="w-3.5 h-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserSection() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = user?.imageUrl;

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-20 bg-muted rounded animate-pulse" />
          <div className="h-2 w-28 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-md group">
      <Avatar className="h-8 w-8 border border-border shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
        <AvatarFallback className="bg-primary/15 text-primary font-medium text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium leading-none truncate">{displayName}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {user.primaryEmailAddress?.emailAddress}
        </div>
      </div>
      <button
        type="button"
        title="Sign out"
        onClick={() => signOut({ redirectUrl: basePath || "/" })}
        className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const [location] = useLocation();
  const Icon = item.icon;
  const isActive = location.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group ${
        isActive
          ? "bg-primary/12 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-foreground"}`} />
      <span className="text-sm">{item.label}</span>
      {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-1.5 px-3 pt-1">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <ThemeSwitcher />
        <div className="border-t border-border/60 mt-2 pt-2">
          <UserSection />
        </div>
      </div>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.fullName || user?.username || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = user?.imageUrl;

  const activeItem = allNavItems.find((item) => location.startsWith(item.href));

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col md:flex-row">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar h-screen sticky top-0">
        <div className="h-14 flex items-center px-5 border-b border-border">
          <Link href="/" className="font-mono font-bold text-lg tracking-tight text-primary flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <FileCode2 className="w-3.5 h-3.5 text-primary" />
            </div>
            Xeioa
          </Link>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-dvh">

        {/* ── Mobile top header ── */}
        <header className="md:hidden sticky top-0 z-40 flex items-center h-14 px-4 gap-3 border-b border-border bg-sidebar/95 backdrop-blur-sm shrink-0">
          <Link href="/" className="font-mono font-bold text-base text-primary flex items-center gap-2 mr-auto">
            <div className="w-6 h-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <FileCode2 className="w-3.5 h-3.5 text-primary" />
            </div>
            Xeioa
          </Link>
          <ThemeSwitcher compact />
          {isLoaded && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="shrink-0">
                  <Avatar className="h-8 w-8 border border-border">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                    <AvatarFallback className="bg-primary/15 text-primary font-medium text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border-border">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ redirectUrl: basePath || "/" })} className="text-red-400 focus:text-red-400 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 page-enter">
          {children}
        </main>

        {/* ── Mobile bottom tab bar (shows Overview + 4 key system items condensed) ── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex h-16 border-t border-border bg-sidebar/95 backdrop-blur-sm">
          {allNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className={`relative flex items-center justify-center w-10 h-6 rounded-full transition-colors ${isActive ? "bg-primary/15" : ""}`}>
                  <Icon className="w-5 h-5" />
                  {isActive && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
