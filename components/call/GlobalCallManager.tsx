"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth-store";
import { agoraRtmService } from "@/lib/services/agora-rtm";
import { IncomingCallModal } from "./IncomingCallModal";
import { ActiveCallModal } from "./ActiveCallModal";
import { FloatingCallWidget } from "./FloatingCallWidget";

export function GlobalCallManager() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      agoraRtmService.initialize(user.id);
    } else {
      agoraRtmService.logout();
    }
  }, [user?.id]);

  return (
    <>
      <IncomingCallModal />
      <ActiveCallModal />
      <FloatingCallWidget />
    </>
  );
}
