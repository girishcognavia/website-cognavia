"use client";

import dynamic from "next/dynamic";

// WebGL only runs in the browser; each visual loads on its own.
const loading = () => <div className="visual visual--loading" aria-hidden />;
export const ToolsToSystem = dynamic(() => import("./ToolsToSystem"), { ssr: false, loading });
export const FutureSite = dynamic(() => import("./FutureSite"), { ssr: false, loading });
export const AgentBoundary = dynamic(() => import("./AgentBoundary"), { ssr: false, loading });
