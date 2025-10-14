"use client";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { BotIcon, VideoIcon, StarIcon, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DashboardUserButton from "../../dashboard-user-button";

const buyerMenu = [
  {
    icon: LayoutDashboard,
    label: "Overview",
    href: "/buyer-dashboard",
  },
  {
    icon: VideoIcon,
    label: "Market",
    href: "/market",
  },
  {
    icon: StarIcon,
    label: "My Portfolio",
    href: "/portfolio",
  },
  {
    icon: LayoutDashboard,
    label: "Transactions",
    href: "/transactions",
  },
  {
    icon: BotIcon,
    label: "AI Insights",
    href: "/ai-insights",
  },
];

const sellerMenu = [
  { icon: LayoutDashboard, label: "Overview", href: "/seller-dashboard?tab=overview" },
  { icon: LayoutDashboard, label: "My Projects", href: "/seller-dashboard?tab=projects" },
  { icon: LayoutDashboard, label: "List Credits", href: "/seller-dashboard?tab=list" },
  { icon: LayoutDashboard, label: "Orders", href: "/seller-dashboard?tab=orders" },
  { icon: LayoutDashboard, label: "Transactions", href: "/seller-dashboard?tab=transactions" },
  { icon: LayoutDashboard, label: "Verification", href: "/seller-dashboard?tab=verification" },
  { icon: LayoutDashboard, label: "Revenue", href: "/seller-dashboard?tab=revenue" },
  { icon: BotIcon, label: "AI Insights", href: "/seller-dashboard?tab=insights" },
];

const secondSection = [
  {
    icon: StarIcon,
    label: "Upgrade",
    href: "/upgrade",
  },
];
export default function DashboardSidebar() {
  const pathname = usePathname();
  const isSeller = pathname.startsWith("/seller-dashboard");
  const firstSection = isSeller ? sellerMenu : buyerMenu;

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href={"/"} className="flex items-center gap-2 px-2 pt-2 ">
          <Image
            src={"/kloro.png"}
            alt="kloro. logo"
            height={100}
            width={100}
          />
         
        </Link>
      </SidebarHeader>
      <div className="px-4 py-2">
        <Separator className="opacity-80 text-[#5d6b68]" />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {firstSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 border border-transparent bg-[var(--sidebar)]",
                      "hover:border-[#592E83]/20",
pathname === item.href &&
                        "border-sidebar-primary/40 bg-sidebar-primary text-sidebar-primary-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="px-4 py-2">
          <Separator className="opacity-80 text-[#5d6b68]" />
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondSection.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 border border-transparent bg-[var(--sidebar)]",
                      "hover:border-[#592E83]/20",
pathname === item.href &&
                        "border-sidebar-primary/40 bg-sidebar-primary text-sidebar-primary-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-white">
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
