"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import { getFirstPropertyRoute } from "@/lib/utils/collection-nav";

export default function WorkspaceRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace as string) || "techform";

  const { activeCollection, collections, selectCollectionByName } = useWorkspaceStore();

  React.useEffect(() => {
    if (workspaceSlug) {
      selectCollectionByName(workspaceSlug);
    }
  }, [workspaceSlug, selectCollectionByName]);

  const currentCollection =
    activeCollection ||
    collections.find((c) => c.collectionName.toLowerCase().trim() === workspaceSlug.toLowerCase()) || {
      id: 0,
      collectionName: workspaceSlug.charAt(0).toUpperCase() + workspaceSlug.slice(1),
      description: "",
      properties: ["Chat", "Profile"],
      collectionType: "general",
      status: "active",
    };

  React.useEffect(() => {
    const targetRoute = getFirstPropertyRoute(currentCollection);
    router.replace(targetRoute);
  }, [currentCollection, router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
      <h2 className="text-base font-semibold text-slate-800">
        Loading {currentCollection.collectionName}...
      </h2>
      <p className="text-xs text-slate-500 mt-1">
        Opening first workspace module
      </p>
    </div>
  );
}
