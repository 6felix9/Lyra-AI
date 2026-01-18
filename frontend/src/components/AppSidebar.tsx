import { Gamepad2, Home, History, Music2, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { authClient } from "@/lib/auth"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "History",
    url: "/history",
    icon: History,
  },
  {
    title: "Play",
    url: "/play",
    icon: Gamepad2,
  },
]

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  const handleSidebarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (state !== "collapsed") return;

    const target = event.target as HTMLElement;
    if (target.closest('[data-sidebar="menu-button"]') || target.closest("a")) {
      return;
    }

    toggleSidebar();
  };

  return (
    <Sidebar
      collapsible="icon"
      className={cn(state === "collapsed" && "cursor-pointer")}
      onClick={handleSidebarClick}
    >
      <SidebarContent className="flex h-full flex-col">
        <SidebarGroup>
          <div
            className={cn(
              "flex w-full items-center gap-2 px-3 py-4",
              state === "expanded" && "justify-between",
              "group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-3 group-data-[collapsible=icon]:px-2"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg hero-gradient shadow-soft">
                <Music2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-sidebar-foreground tracking-tight group-data-[collapsible=icon]:hidden">
                Lyra
              </span>
            </div>
            {state === "expanded" ? <SidebarTrigger className="-mr-1" /> : null}
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url || location.pathname.startsWith(`${item.url}/`)} 
                    size="lg" 
                    tooltip={item.title}
                    className="text-base group-data-[collapsible=icon]:justify-center"
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  size="lg"
                  tooltip="Logout"
                  className="text-base group-data-[collapsible=icon]:justify-center"
                >
                  <LogOut />
                  <span className="group-data-[collapsible=icon]:hidden">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
