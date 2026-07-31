import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore, Firestore } from "firebase-admin/firestore";

dotenv.config();

// -------------------------------------------------------------
// FIREBASE INITIALIZATION
// -------------------------------------------------------------
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "divine-function-j07pf";
const firestoreDatabaseId = process.env.FIRESTORE_DATABASE_ID;

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    console.log("[Alco API Service] Initializing Firestore using Service Account credentials.");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      })
    });
  } else {
    console.log("[Alco API Service] Initializing Firestore using Default/Project metadata.");
    admin.initializeApp({
      projectId: firebaseProjectId
    });
  }
}

// Durable Database Getter (Stateless)
const getAdminDb = (): Firestore => {
  return firestoreDatabaseId ? getFirestore(admin.app(), firestoreDatabaseId) : getFirestore();
};

// -------------------------------------------------------------
// EXPRESS APP CONFIGURATION
// -------------------------------------------------------------
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware Setup
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// SECURE REST API KEY MIDDLEWARE (STATELESS AUTHENTICATION)
// -------------------------------------------------------------
interface AuthenticatedRequest extends Request {
  userId?: string;
  apiKey?: string;
}

const apiAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = 
      req.headers["x-api-key"] || 
      req.headers["X-API-Key"] || 
      (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") 
        ? req.headers.authorization.split(" ")[1] 
        : null);

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({
        success: false,
        error: "API_KEY_REQUIRED",
        message: "API key diperlukan. Sertakan dalam header 'x-api-key' atau 'Authorization: Bearer <key>'."
      });
    }

    let userId: string | null = null;

    // Statelessly resolve the User ID ownership by querying Firestore directly
    try {
      const settingsSnapshot = await getAdminDb()
        .collection("userSettings")
        .where("apiKey", "==", apiKey)
        .limit(1)
        .get();

      if (!settingsSnapshot.empty) {
        const doc = settingsSnapshot.docs[0];
        userId = doc.id; // User's authenticated Firebase UID
      }
    } catch (dbError: any) {
      console.error("[Alco API Auth] Firestore lookup error:", dbError.message || dbError);
      return res.status(503).json({
        success: false,
        error: "AUTH_SERVICE_UNAVAILABLE",
        message: "Gagal menghubungkan ke database untuk memverifikasi API Key Anda."
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "INVALID_API_KEY",
        message: "API key yang diberikan tidak valid atau telah dicabut."
      });
    }

    req.userId = userId;
    req.apiKey = apiKey;
    next();
  } catch (error: any) {
    console.error("[Alco API Auth] Core validator error:", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Terjadi kesalahan internal pada server saat memproses otentikasi."
    });
  }
};

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// GET /api/bootstrap (Public endpoint for service discovery and integration checklist)
app.get("/api/bootstrap", (req: Request, res: Response) => {
  res.json({
    apiVersion: "1.0.0",
    status: "ok",
    endpoints: [
      {
        path: "/api/bootstrap",
        method: "GET",
        description: "Bootstrap configuration & external route listing",
        authRequired: false
      },
      {
        path: "/api/health",
        method: "GET",
        description: "Verify integration API key status and backend heartbeat status",
        authRequired: true
      },
      {
        path: "/api/brands",
        method: "GET",
        description: "Query list of all configured branding workspaces owned by the key holder",
        authRequired: true
      },
      {
        path: "/api/projects",
        method: "GET",
        description: "Query list of all active copywriting/marketer projects owned by the key holder",
        authRequired: true
      },
      {
        path: "/api/context/content/:brandId",
        method: "GET",
        description: "Retrieve comprehensive Niche, Target Audience and Pain Point datasets for a brand",
        authRequired: true
      },
      {
        path: "/api/context/ads/:brandId",
        method: "GET",
        description: "Retrieve Marketing Angles and Campaign Ad copy variations for a brand",
        authRequired: true
      },
      {
        path: "/api/context/product/:brandId",
        method: "GET",
        description: "Retrieve Pricing strategy, Offer stacks and Product Positioning properties for a brand",
        authRequired: true
      },
      {
        path: "/api/context/copy/:brandId",
        method: "GET",
        description: "Retrieve final generated ad copywriting directions for a brand",
        authRequired: true
      }
    ]
  });
});

// GET /api/health (Protected heartbeat)
app.get("/api/health", apiAuth as any, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    status: "ok",
    message: "Sistem API Alco berjalan dengan baik.",
    timestamp: new Date().toISOString(),
    userId: req.userId
  });
});

// GET /api/brands (Protected listing of brands)
app.get("/api/brands", apiAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectsSnapshot = await getAdminDb()
      .collection("projects")
      .where("userId", "==", req.userId)
      .get();

    const brands = projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        brandName: data.brandFoundationData?.brandName || data.name || "Brand Tanpa Nama",
        industry: data.nicheData?.input?.interest || data.brandFoundationData?.industry || "Belum Ditentukan",
        tagline: data.brandFoundationData?.brandFeel || "",
        primaryColor: data.brandFoundationData?.colors?.primary || "#4f46e5",
        secondaryColor: data.brandFoundationData?.colors?.secondary || "#0f172a",
        accentColor: data.brandFoundationData?.colors?.accent || "#f59e0b",
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
      };
    });

    res.json({
      success: true,
      count: brands.length,
      data: brands
    });
  } catch (error: any) {
    console.error("[Alco API] GET /api/brands failure:", error);
    res.status(500).json({
      success: false,
      error: "DATABASE_ERROR",
      message: "Gagal berinteraksi dengan database Firestore."
    });
  }
});

// GET /api/projects (Protected listing of projects)
app.get("/api/projects", apiAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectsSnapshot = await getAdminDb()
      .collection("projects")
      .where("userId", "==", req.userId)
      .get();

    const projects = projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        currentStep: data.currentStep || 1,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
      };
    });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error: any) {
    console.error("[Alco API] GET /api/projects failure:", error);
    res.status(500).json({
      success: false,
      error: "DATABASE_ERROR",
      message: "Gagal memproses daftar project di Firestore."
    });
  }
});

// GET /api/context/content/:brandId
app.get("/api/context/content/:brandId", apiAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectDoc = await getAdminDb()
      .collection("projects")
      .doc(req.params.brandId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Brand/Project tidak ditemukan." });
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== req.userId) {
      return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Anda tidak memiliki akses ke brand ini." });
    }

    res.json({
      success: true,
      brandId: req.params.brandId,
      brandName: projectData.brandFoundationData?.brandName || projectData.name,
      contextType: "content",
      data: {
        nicheData: projectData.nicheData || null,
        audienceData: projectData.audienceData || null,
        painPointData: projectData.painPointData || null,
        brandFoundation: projectData.brandFoundationData || null,
        brandIntelligence: projectData.brandIntelligence || null
      }
    });
  } catch (error: any) {
    console.error("[Alco API] GET /api/context/content error:", error);
    res.status(500).json({ success: false, error: "SERVER_ERROR", message: error.message });
  }
});

// GET /api/context/ads/:brandId
app.get("/api/context/ads/:brandId", apiAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectDoc = await getAdminDb()
      .collection("projects")
      .doc(req.params.brandId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Brand/Project tidak ditemukan." });
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== req.userId) {
      return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Anda tidak memiliki akses ke brand ini." });
    }

    res.json({
      success: true,
      brandId: req.params.brandId,
      contextType: "ads",
      data: {
        marketingAngles: projectData.marketingAngles || null,
        adsVariations: projectData.adsVariations || null
      }
    });
  } catch (error: any) {
    console.error("[Alco API] GET /api/context/ads error:", error);
    res.status(500).json({ success: false, error: "SERVER_ERROR", message: error.message });
  }
});

// GET /api/context/product/:brandId
app.get("/api/context/product/:brandId", apiAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectDoc = await getAdminDb()
      .collection("projects")
      .doc(req.params.brandId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Brand/Project tidak ditemukan." });
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== req.userId) {
      return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Anda tidak memiliki akses ke brand ini." });
    }

    res.json({
      success: true,
      brandId: req.params.brandId,
      contextType: "product",
      data: {
        productName: projectData.brandFoundationData?.brandName || projectData.name,
        offerData: projectData.offerData || null,
        positioningData: projectData.positioningData || null
      }
    });
  } catch (error: any) {
    console.error("[Alco API] GET /api/context/product error:", error);
    res.status(500).json({ success: false, error: "SERVER_ERROR", message: error.message });
  }
});

// GET /api/context/copy/:brandId
app.get("/api/context/copy/:brandId", apiAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectDoc = await getAdminDb()
      .collection("projects")
      .doc(req.params.brandId)
      .get();

    if (!projectDoc.exists) {
      return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Brand/Project tidak ditemukan." });
    }

    const projectData = projectDoc.data();
    if (projectData?.userId !== req.userId) {
      return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Anda tidak memiliki akses ke brand ini." });
    }

    res.json({
      success: true,
      brandId: req.params.brandId,
      contextType: "copy",
      data: {
        copyDirection: projectData.copyDirection || null
      }
    });
  } catch (error: any) {
    console.error("[Alco API] GET /api/context/copy error:", error);
    res.status(500).json({ success: false, error: "SERVER_ERROR", message: error.message });
  }
});

// Catch-all 404 router for rest API compliance
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: "Rute endpoint yang Anda cari tidak ditemukan pada server API Alco."
  });
});

// Start listen hook
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Alco Backend Server] Running successfully on port ${PORT}`);
});
