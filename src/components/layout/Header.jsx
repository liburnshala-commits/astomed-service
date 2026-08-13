import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, ChevronLeft, ChevronRight as ChevronRightIcon, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Header({ user, isRootScreen, setSidebarOpen }) {
  const navigate = useNavigate();
  
  return (
    <header className="bg-card px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] flex items-center gap-3 shadow-sm justify-between border-b border-border sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
          <Menu className="w-5 h-5" />
        </Button>
        
        {isRootScreen ? (
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-primary">
              <span className="text-primary-foreground font-bold text-[10px]">AST</span>
            </div>
            <span className="font-semibold text-foreground">Astomed Pro</span>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Föregående sida" className="text-foreground lg:hidden">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="hidden lg:flex items-center gap-2">
          <Link
            to={createPageUrl("Dashboard")}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors bg-accent text-accent-foreground hover:bg-accent/80"
            title="Gå till Dashboard"
          >
            <Home className="w-4 h-4" />
          </Link>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} title="Föregående sida" className="text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)} title="Nästa sida" className="text-foreground">
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>
        
        <span className="font-semibold hidden" style={{ color: "#1b3a3a" }}>Astomed Pro</span>
      </div>
      <div className="flex-1 flex justify-end px-2 sm:px-4 max-w-md">
        {user && user.role !== "customer" && <GlobalSearch />}
      </div>
      <NotificationBell />
    </header>
  );
}