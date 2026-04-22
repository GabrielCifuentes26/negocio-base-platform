"use client";

import {
  createContext,
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import {
  clearPreferredBusinessId,
  persistPreferredBusinessId,
  readPreferredBusinessId,
} from "@/lib/auth/workspace-preferences";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signInWithPassword, signOutCurrentUser } from "@/services/api/auth-service";
import {
  getDemoWorkspaceBundle,
  getWorkspaceBundle,
  setPreferredBusinessSelection,
} from "@/services/api/workspace-service";
import type { AuthStatus, SignInCredentials } from "@/types/auth";
import type { ActiveWorkspace, WorkspaceSummary } from "@/types/workspace";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: ActiveWorkspace["user"] | null;
  workspace: ActiveWorkspace | null;
  workspaces: WorkspaceSummary[];
  activeBusinessId: string | null;
  error: string | null;
  supabaseEnabled: boolean;
  signIn: (credentials: SignInCredentials) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshWorkspace: (businessId?: string | null) => Promise<void>;
  switchWorkspace: (businessId: string) => Promise<{ error: string | null }>;
};

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: ActiveWorkspace["user"] | null;
  workspace: ActiveWorkspace | null;
  workspaces: WorkspaceSummary[];
  error: string | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function getDemoState(): AuthState {
  const bundle = getDemoWorkspaceBundle();

  return {
    status: "demo",
    session: null,
    user: bundle.workspace?.user ?? null,
    workspace: bundle.workspace,
    workspaces: bundle.workspaces,
    error: null,
  };
}

function getSignedOutState(): AuthState {
  return {
    status: "unauthenticated",
    session: null,
    user: null,
    workspace: null,
    workspaces: [],
    error: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseEnabled = isSupabaseConfigured();
  const [state, setState] = useState<AuthState>(() =>
    supabaseEnabled
      ? {
          status: "loading",
          session: null,
          user: null,
          workspace: null,
          workspaces: [],
          error: null,
        }
      : getDemoState(),
  );

  const syncSession = useEffectEvent(async (session: Session | null, explicitBusinessId?: string | null) => {
    if (!supabaseEnabled) {
      startTransition(() => setState(getDemoState()));
      return;
    }

    if (!session) {
      startTransition(() => setState(getSignedOutState()));
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      startTransition(() =>
        setState({
          ...getSignedOutState(),
          error: "No se pudo inicializar Supabase.",
        }),
      );
      return;
    }

    startTransition(() =>
      setState((current) => ({
        ...current,
        status: "loading",
        session,
      })),
    );

    try {
      const preferredBusinessId = explicitBusinessId ?? readPreferredBusinessId() ?? state.workspace?.businessId ?? null;
      const bundle = await getWorkspaceBundle(client, session, preferredBusinessId);

      if (bundle.workspace?.businessId) {
        persistPreferredBusinessId(bundle.workspace.businessId);
      }

      startTransition(() =>
        setState({
          status: "authenticated",
          session,
          user: bundle.workspace?.user ?? null,
          workspace: bundle.workspace,
          workspaces: bundle.workspaces,
          error: bundle.workspace ? null : "Tu usuario no tiene una membresia activa asignada.",
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo cargar tu espacio.";

      startTransition(() =>
        setState({
          status: "authenticated",
          session,
          user: null,
          workspace: null,
          workspaces: [],
          error: message,
        }),
      );
    }
  });

  useEffect(() => {
    if (!supabaseEnabled) {
      startTransition(() => setState(getDemoState()));
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      startTransition(() =>
        setState({
          ...getSignedOutState(),
          error: "No se pudo inicializar Supabase.",
        }),
      );
      return;
    }

    let isActive = true;

    void client.auth.getSession().then(({ data, error }) => {
      if (!isActive) {
        return;
      }

      if (error) {
        startTransition(() =>
          setState({
            ...getSignedOutState(),
            error: error.message,
          }),
        );
        return;
      }

      void syncSession(data.session);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return;
      }

      void syncSession(session);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabaseEnabled]);

  async function refreshWorkspace(businessId?: string | null) {
    if (!supabaseEnabled) {
      startTransition(() => setState(getDemoState()));
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client || !state.session) {
      return;
    }

    try {
      const preferredBusinessId = businessId ?? readPreferredBusinessId() ?? state.workspace?.businessId ?? null;

      if (businessId) {
        const preferenceResult = await setPreferredBusinessSelection(client, businessId);

        if (preferenceResult.error) {
          throw new Error(preferenceResult.error);
        }
      }

      startTransition(() =>
        setState((current) => ({
          ...current,
          status: "loading",
        })),
      );

      const bundle = await getWorkspaceBundle(client, state.session, preferredBusinessId);

      if (bundle.workspace?.businessId) {
        persistPreferredBusinessId(bundle.workspace.businessId);
      }

      startTransition(() =>
        setState((current) => ({
          ...current,
          status: "authenticated",
          user: bundle.workspace?.user ?? current.user,
          workspace: bundle.workspace,
          workspaces: bundle.workspaces,
          error: bundle.workspace ? null : current.error,
        })),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo refrescar el negocio.";

      startTransition(() =>
        setState((current) => ({
          ...current,
          status: "authenticated",
          error: message,
        })),
      );
    }
  }

  async function switchWorkspace(businessId: string) {
    if (!supabaseEnabled) {
      return { error: null };
    }

    const targetExists = state.workspaces.some((workspace) => workspace.businessId === businessId);

    if (!targetExists) {
      return { error: "No tienes acceso al negocio seleccionado." };
    }

    persistPreferredBusinessId(businessId);
    await refreshWorkspace(businessId);
    return { error: null };
  }

  async function handleSignIn(credentials: SignInCredentials) {
    if (!supabaseEnabled) {
      startTransition(() => setState(getDemoState()));
      return { error: null };
    }

    return signInWithPassword(credentials);
  }

  async function handleSignOut() {
    const result = await signOutCurrentUser();

    if (!result.error) {
      clearPreferredBusinessId();
      startTransition(() => setState(supabaseEnabled ? getSignedOutState() : getDemoState()));
    }

    return result;
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        activeBusinessId: state.workspace?.businessId ?? null,
        supabaseEnabled,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshWorkspace,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
