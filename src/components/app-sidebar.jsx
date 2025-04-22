"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
  Image,
  Eraser,
  Scissors,
  Expand,
  Trash2,
  ZoomIn,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Contact",
      url: "/contact",
      icon: Send,
    },
    {
      title: "About Us",
      url: "/about",
      icon: LifeBuoy,
    },
  ],
  projects: [
    {
      name: "Background Generation",
      url: "/workspace/backgroundgeneration",
      icon: Image,
    },
    {
      name: "Object Retouch",
      url: "/workspace/objectRetouch",
      icon: Eraser,
    },
    {
      name: "Object Removal",
      url: "/dashboard/tools/object-removal",
      icon: Trash2,
    },
    {
      name: "Background Expansion",
      url: "/workspace/backgroundexpansion",
      icon: Expand,
    },
    {
      name: "Background Removal",
      url: "/dashboard/tools/background-remover",
      icon: Scissors,
    },
    {
      name: "Image UpScale",
      url: "/dashboard/tools/image-upscaler",
      icon: ZoomIn,
    },
  ],
}

export function AppSidebar({
  user,
  ...props
}) {
  // Prepare user data for NavUser component with proper fallbacks
  const userData = React.useMemo(() => ({
    name: user?.displayName || "User",
    email: user?.email || "user@example.com",
    avatar: user?.photoURL || "",
  }), [user?.displayName, user?.email, user?.photoURL]);

  return (
    <Sidebar variant="inset" className="bg-[#18181B] text-white" {...props}>
      <SidebarFooter className="bg-[#18181B]">
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarContent className="bg-[#18181B]">
        <NavProjects projects={data.projects} />
        <NavMain items={data.navMain}/>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
