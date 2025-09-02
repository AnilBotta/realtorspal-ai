// realtorspal-ai/src/hooks/useUserRole.ts
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useUserRole() {
  const { user } = useAuth();
  const role = useMemo(() => {
    const r = (user?.role || "agent").toLowerCase();
    if (r === "admin" || r === "demo" || r === "agent" || r === "viewer" || r === "client") return r;
    return "agent";
  }, [user]);

  return {
    role,
    isAdmin: role === "admin",
    isDemo: role === "demo",
    isClient: role === "client" || role === "agent" || role === "viewer",
    user,
  };
}

