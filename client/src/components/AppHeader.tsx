import { 
  Search, 
  Menu,
  ShoppingCart,
  Table,
  MonitorPlay,
  UtensilsCrossed,
  Calendar,
  FileText,
  MoreVertical,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  title?: string;
  showSearch?: boolean;
  onReservationClick?: () => void;
  isReservationMode?: boolean;
}

export default function AppHeader({
  title = "Restaurant POS",
  showSearch = true,
  onReservationClick,
  isReservationMode = false,
}: AppHeaderProps) {
  const [location, setLocation] = useLocation();
  const { toggleSidebar } = useSidebar();

  const mainNavButtons = [
    { 
      label: "Billing / POS", 
      icon: ShoppingCart, 
      path: "/billing",
      color: "text-blue-600 dark:text-blue-400"
    },
    { 
      label: "Tables", 
      icon: Table, 
      path: "/tables",
      color: "text-purple-600 dark:text-purple-400"
    },
    { 
      label: "Kitchen Display", 
      icon: MonitorPlay, 
      path: "/kitchen",
      color: "text-green-600 dark:text-green-400"
    },
    { 
      label: "KOT", 
      icon: ClipboardList, 
      path: "/kot",
      color: "text-orange-600 dark:text-orange-400"
    },
    { 
      label: "Menu", 
      icon: UtensilsCrossed, 
      path: "/menu",
      color: "text-orange-600 dark:text-orange-400"
    },
    { 
      label: "Invoices", 
      icon: FileText, 
      path: "/invoices",
      color: "text-indigo-600 dark:text-indigo-400"
    },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 shadow-sm">
      {/* Top Header Bar */}
      <div className="px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Section: Hamburger + Logo/Title + Search */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Hamburger Menu - Now visible on all screen sizes */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 h-9 w-9"
              data-testid="button-sidebar-toggle"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo/Title */}
            <button 
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
              data-testid="button-logo"
            >
              <div className="bg-red-600 text-white px-2 py-1 rounded font-bold text-sm hidden sm:block">
                POS
              </div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
            </button>

            {/* Search Bar - Desktop */}
            {showSearch && (
              <div className="relative max-w-md flex-1 hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Bill No"
                  className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  data-testid="input-search"
                />
              </div>
            )}
          </div>

          {/* Right Section: Main Navigation */}
          <div className="flex items-center gap-1">
            {/* Mobile Navigation Menu (Hamburger) - Only on small/medium screens */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    data-testid="button-nav-menu-mobile"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      if (location !== "/tables") {
                        setLocation("/tables");
                      }
                      if (onReservationClick) {
                        onReservationClick();
                      }
                    }}
                    data-testid="menu-reservation"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reservation
                  </DropdownMenuItem>
                  {mainNavButtons.map((button) => {
                    const Icon = button.icon;
                    return (
                      <DropdownMenuItem
                        key={button.path}
                        onClick={() => setLocation(button.path)}
                        data-testid={`menu-${button.label.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "")}`}
                      >
                        <Icon className={cn("h-4 w-4 mr-2", button.color)} />
                        {button.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Reservation Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  if (location !== "/tables") {
                    setLocation("/tables");
                  }
                  if (onReservationClick) {
                    onReservationClick();
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  isReservationMode 
                    ? "bg-blue-100 dark:bg-blue-900 shadow-sm" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                data-testid="button-reservation"
              >
                <Calendar className={cn(
                  "h-4 w-4",
                  isReservationMode ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isReservationMode ? "text-blue-900 dark:text-blue-100" : "text-gray-600 dark:text-gray-300"
                )}>
                  Reservation
                </span>
              </Button>

              {/* Main Navigation Buttons */}
              {mainNavButtons.map((button) => {
                const Icon = button.icon;
                const isActive = location === button.path;
                
                return (
                  <Button
                    key={button.path}
                    variant="ghost"
                    onClick={() => setLocation(button.path)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                      isActive 
                        ? "bg-gray-100 dark:bg-gray-800 shadow-sm" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    data-testid={`nav-${button.label.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "")}`}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? button.color : "text-gray-500 dark:text-gray-400")} />
                    <span className="text-sm font-medium">
                      {button.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
