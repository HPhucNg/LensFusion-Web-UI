"use client"

import Link from "next/link"
import { Folder, MoreHorizontal, Share, Trash2 } from "lucide-react";
import { useTheme } from '@/hooks/useTheme';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { theme } = useTheme();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((project) => (
          <SidebarMenuItem key={project.name}>
            <SidebarMenuButton asChild tooltip={project.name}>
              <Link href={project.url} className="group/nav-link">
                <project.icon className="text-sidebar-muted-foreground group-hover/nav-link:text-sidebar-foreground" />
                {!isCollapsed && <span>{project.name}</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
