import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import React from "react";
import { 
  LayoutDashboard, 
  Search, 
  CheckCircle2, 
  Package, 
  Gift, 
  MousePointer2, 
  Type, 
  FileCode, 
  Zap, 
  TrendingUp,
  Settings,
  LogOut,
  ShieldAlert,
  Palette,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Power,
  Key,
  ExternalLink
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { useBranding } from "@/contexts/BrandingContext";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Pusat Dasbor", path: "/dashboard" },
  { icon: Key, label: "API Access", path: "/api-access" },
];

export default function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const { config } = useBranding();
  const [isDevActive, setIsDevActive] = React.useState(localStorage.getItem("alco_developer_mode_active") === "true");

  React.useEffect(() => {
    const checkAuth = () => {
      setIsDevActive(localStorage.getItem("alco_developer_mode_active") === "true");
    };
    
    window.addEventListener("alco_developer_auth_changed", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("alco_developer_auth_changed", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const handleExitDevMode = () => {
    localStorage.removeItem("alco_developer_mode_active");
    setIsDevActive(false);
    window.dispatchEvent(new Event("alco_developer_auth_changed"));
    toast.success("Developer Mode Deactivated");
    window.location.href = "/dashboard";
  };

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r border-sidebar-border p-3 sm:p-4", className)}>

      <div className="flex items-center justify-between gap-2 px-1 sm:px-2 mb-6 sm:mb-8 overflow-hidden">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 sm:w-8 sm:h-8 bg-primary flex items-center justify-center rounded-lg shadow-lg shadow-primary/20 shrink-0 overflow-hidden">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-[Montserrat] font-black text-xl leading-none">{config.appName.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-heading font-bold tracking-tight text-sm sm:text-base leading-none truncate">{config.appName}</span>
              {isDevActive && (
                <span className="bg-emerald-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">DEV</span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] truncate">{config.companyName}</span>
          </div>
        </div>

        {/* Dynamic button link on the right edge */}
      </div>

      <div className="flex-1 space-y-1">
        <p className="px-2 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Ekosistem Eksekusi</p>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={cn(
              "flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl transition-all duration-200 group",
              location.pathname === item.path 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className={cn(
              "w-4 h-4 transition-transform duration-300 group-hover:scale-110",
              location.pathname === item.path ? "text-primary-foreground" : "text-muted-foreground/60 group-hover:text-primary"
            )} />
            <span className="text-sm font-semibold">{item.label}</span>
          </Link>
        ))}

        <p className="px-2 text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-5 sm:mt-6 mb-3">Mesin Konten</p>
        <a
          href="https://alco-content-engine-486549138020.asia-southeast1.run.app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-3 sm:py-2.5 rounded-xl text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-all duration-300 group shadow-sm shadow-primary/5 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-primary fill-primary/10 group-hover:animate-bounce" />
            <span className="text-sm font-extrabold font-heading">Content Engine</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-primary/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
        </a>
      </div>

      <div className="pt-4 border-t border-sidebar-border/50 space-y-3">
        <button
          onClick={() => auth.signOut()}
          id="btn-logout"
          className="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-100/40 hover:text-red-400 hover:bg-red-400/5 transition-all text-left group"
        >
          <LogOut className="w-4 h-4 text-red-100/20 group-hover:text-red-400" />
          <span className="text-sm font-medium">Keluar dari Sistem</span>
        </button>

        {/* Subtle, Hidden Admin / Dev Mode Navigation Links */}
        <div className="hidden sm:flex items-center justify-between gap-2 px-2 text-[8px] text-muted-foreground/30 font-semibold tracking-wider pt-2 border-t border-sidebar-border/30">
          <span>SYSTEM v1.5</span>
          {isDevActive ? (
            <div className="flex items-center gap-2">
              <Link to="/developer" className="hover:text-emerald-500 hover:underline uppercase text-[8px] font-black">Panel</Link>
              <Link to="/rebrand" className="hover:text-primary hover:underline uppercase text-[8px] font-black">Rebrand</Link>
              <button onClick={handleExitDevMode} className="hover:text-orange-500 hover:underline uppercase text-[8px] font-black cursor-pointer">Lock</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/rebrand" className="hover:text-primary hover:underline text-[8px] font-black uppercase tracking-wider">
                🎨 Rebrand
              </Link>
              <span>•</span>
              <Link to="/developer" className="hover:text-amber-500 hover:underline text-[8px] uppercase">
                🔒 Admin Session
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
