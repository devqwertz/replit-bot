import { useEffect, useRef } from "react";
import { ThemeProvider } from "@/hooks/use-theme";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Scripts from "@/pages/scripts/index";
import ScriptDetail from "@/pages/scripts/[id]";
import SourceViewer from "@/pages/scripts/source-viewer";
import Logs from "@/pages/logs";
import Bans from "@/pages/bans";
import Services from "@/pages/services";
import Integrations from "@/pages/integrations";
import Providers from "@/pages/providers";
import Keys from "@/pages/keys";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#6366f1",
    colorForeground: "#f8fafc",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#0f172a",
    colorInput: "#1e293b",
    colorInputForeground: "#f8fafc",
    colorNeutral: "#334155",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-slate-900 rounded-xl w-[440px] max-w-full overflow-hidden border border-white/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-bold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-white",
    formFieldLabel: "text-slate-300",
    footerActionLink: "text-indigo-400",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-500",
    identityPreviewEditButton: "text-indigo-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-white",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border-white/10 hover:bg-white/5",
    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500",
    formFieldInput: "bg-slate-800 border-white/10 text-white",
    footerAction: "bg-transparent",
    dividerLine: "bg-white/10",
    alert: "bg-red-500/10 border-red-500/20",
    otpCodeFieldInput: "bg-slate-800 border-white/10 text-white",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/dashboard">
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      </Route>

      {/* Key System */}
      <Route path="/services">
        <ProtectedRoute><AppLayout><Services /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/integrations">
        <ProtectedRoute><AppLayout><Integrations /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/providers">
        <ProtectedRoute><AppLayout><Providers /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/keys">
        <ProtectedRoute><AppLayout><Keys /></AppLayout></ProtectedRoute>
      </Route>

      {/* Scripts */}
      <Route path="/scripts">
        <ProtectedRoute><AppLayout><Scripts /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/scripts/:id/source">
        {params => (
          <ProtectedRoute><SourceViewer scriptId={params.id} type="source" /></ProtectedRoute>
        )}
      </Route>
      <Route path="/scripts/:id/obfuscated">
        {params => (
          <ProtectedRoute><SourceViewer scriptId={params.id} type="obfuscated" /></ProtectedRoute>
        )}
      </Route>
      <Route path="/scripts/:id">
        {params => (
          <ProtectedRoute><AppLayout><ScriptDetail id={params.id} /></AppLayout></ProtectedRoute>
        )}
      </Route>
      <Route path="/logs">
        <ProtectedRoute><AppLayout><Logs /></AppLayout></ProtectedRoute>
      </Route>
      <Route path="/bans">
        <ProtectedRoute><AppLayout><Bans /></AppLayout></ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to access Xeioa",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Start managing your Lua scripts on Xeioa",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
