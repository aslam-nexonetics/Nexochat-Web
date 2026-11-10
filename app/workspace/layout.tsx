"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { useAuthStore } from "@/lib/store/auth-store";

export default function WorkspaceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loadCollections } = useWorkspaceStore();
  const { checkAuth } = useAuthStore();

  React.useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const isAuthed = await checkAuth();
      if (isAuthed && isMounted) {
        await loadCollections();
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [checkAuth, loadCollections]);

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans antialiased text-slate-900">
      {children}
    </div>
  );
}
