"use client"

import { ChevronRight } from "lucide-react";
import { useTheme } from '@/hooks/useTheme';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items
}) {
  const { theme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[color:hsl(var(--sidebar-foreground))] font-semibold">Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton 
                asChild 
                tooltip={item.title}
                className={isCollapsed ? "justify-center" : ""}
              >
                <a href={item.url} className="text-[color:hsl(var(--sidebar-muted))] hover:text-[color:hsl(var(--sidebar-foreground))] font-medium">
                  <item.icon className="text-[color:hsl(var(--sidebar-muted-foreground))]" />
                  {!isCollapsed && <span>{item.title}</span>}
                </a>
              </SidebarMenuButton>
              {item.items?.length && !isCollapsed ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight className="text-[color:hsl(var(--sidebar-muted-foreground))]" />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url} className="text-[color:hsl(var(--sidebar-muted))] hover:text-[color:hsl(var(--sidebar-foreground))] font-medium">
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
