import React from "react";
import { doc, getDoc, setDoc, onSnapshot, db } from "@/lib/firebase";
import { toast } from "sonner";

export interface AppConfig {
  developerPassword: string;
  rebrandingPassword: string;
  appName: string;
  toolName: string;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  successColor: string;
  warningColor: string;
  errorColor: string;
  primaryFont: string;
  supportingFont: string;
  tagline: string;
  brandVoice: string;
  aiAssistantName: string;
  supportContact: string;
  companyName: string;
  faviconUrl: string;
  dashboardText: string;
  footerText: string;
  styleMode: "modern" | "brutalist" | "minimal";
  loadingText: string;
  // AI and System Config
  aiPrompts: Record<string, string>;
  featureFlags: Record<string, boolean>;
  rollbackConfig?: Partial<AppConfig>;
}

const DEFAULT_CONFIG: AppConfig = {
  developerPassword: "aladzan92@",
  rebrandingPassword: "1234567890",
  appName: "Alco Creative",
  toolName: "Ads AI Builder",
  brandName: "Alco",
  logoUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  accentColor: "#3b82f6",
  backgroundColor: "#f8fafc",
  foregroundColor: "#0f172a",
  successColor: "#10b981",
  warningColor: "#f59e0b",
  errorColor: "#ef4444",
  primaryFont: "Montserrat",
  supportingFont: "Inter",
  tagline: "Build Faster. Scale Smarter.",
  brandVoice: "Professional, Bold, and Innovative",
  aiAssistantName: "Alco Assistant",
  supportContact: "support@alco.com",
  companyName: "Alco Systems",
  faviconUrl: "",
  dashboardText: "Create High-Converting Ads with AI",
  footerText: "Powered by Alco Systems",
  styleMode: "modern",
  loadingText: "Initializing Alco Creative System",
  aiPrompts: {},
  featureFlags: {
    enableVideo: true,
    enableCarousel: true,
    enableStrategy: true,
  }
};

interface BrandingContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => Promise<void>;
  loading: boolean;
}

const BrandingContext = React.createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "config"), (snapshot) => {
      if (snapshot.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...snapshot.data() } as AppConfig);
      } else {
        // Initialize if not exists
        setDoc(doc(db, "settings", "config"), DEFAULT_CONFIG);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    try {
      await setDoc(doc(db, "settings", "config"), { ...config, ...newConfig }, { merge: true });
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update settings");
    }
  };

  // Apply colors and fonts dynamically
  React.useEffect(() => {
    if (config.primaryColor) {
      document.documentElement.style.setProperty("--primary", config.primaryColor);
    }
    if (config.secondaryColor) {
      document.documentElement.style.setProperty("--secondary", config.secondaryColor);
    }
    if (config.accentColor) {
      document.documentElement.style.setProperty("--accent", config.accentColor);
    }
    if (config.backgroundColor) {
      document.documentElement.style.setProperty("--background", config.backgroundColor);
    }
    if (config.foregroundColor) {
      document.documentElement.style.setProperty("--foreground", config.foregroundColor);
    }
    if (config.successColor) {
      document.documentElement.style.setProperty("--success", config.successColor);
    }
    if (config.warningColor) {
      document.documentElement.style.setProperty("--warning", config.warningColor);
    }
    if (config.errorColor) {
      document.documentElement.style.setProperty("--error", config.errorColor);
      document.documentElement.style.setProperty("--destructive", config.errorColor);
    }
    if (config.primaryFont) {
       document.documentElement.style.setProperty("--font-heading", config.primaryFont);
    }
    if (config.supportingFont) {
       document.documentElement.style.setProperty("--font-sans", config.supportingFont);
    }
    if (config.appName) {
      document.title = config.appName;
    }
    if (config.faviconUrl) {
      const link: any = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = config.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (config.primaryFont || config.supportingFont) {
       const fonts = [];
       if (config.primaryFont) fonts.push(config.primaryFont.replace(/ /g, "+"));
       if (config.supportingFont) fonts.push(config.supportingFont.replace(/ /g, "+"));
       
       const linkId = "branding-fonts";
       let link = document.getElementById(linkId) as HTMLLinkElement;
       if (!link) {
         link = document.createElement("link");
         link.id = linkId;
         link.rel = "stylesheet";
         document.head.appendChild(link);
       }
       link.href = `https://fonts.googleapis.com/css2?family=${fonts.join("&family=")}:wght@400;700;900&display=swap`;
    }
  }, [config]);

  return (
    <BrandingContext.Provider value={{ config, updateConfig, loading }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = React.useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
