import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"

const SIDEBAR_STATE_COOKIE = "sidebar:state";

function getSidebarDefaultOpen() {
  if (typeof document === "undefined") {
    return false;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SIDEBAR_STATE_COOKIE}=`));

  if (!cookie) {
    return false;
  }

  return cookie.split("=")[1] === "true";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const defaultOpen = getSidebarDefaultOpen();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset className="soft-gradient">
        <main className="flex-1 h-[calc(100dvh)] overflow-hidden">
             {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
