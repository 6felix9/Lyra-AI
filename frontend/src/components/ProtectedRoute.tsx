import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { authClient } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = authClient.useSession();

  if (session.isPending) {
    return null;
  }

  if (!session.data) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
