import { Navigate } from "react-router-dom";
import { authClient } from "@/lib/auth";

export function LandingRedirect() {
  const session = authClient.useSession();

  if (session.isPending) {
    return null;
  }

  return <Navigate to={session.data ? "/dashboard" : "/login"} replace />;
}
