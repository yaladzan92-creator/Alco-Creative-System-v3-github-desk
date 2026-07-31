var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_firestore = require("firebase-admin/firestore");
var import_cors = __toESM(require("cors"), 1);
import_dotenv.default.config();
var firebaseProjectId = "divine-function-j07pf";
var firestoreDatabaseId = void 0;
try {
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    const configData = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
    if (configData.projectId) {
      firebaseProjectId = configData.projectId;
    }
    if (configData.firestoreDatabaseId) {
      firestoreDatabaseId = configData.firestoreDatabaseId;
    }
  }
} catch (error) {
  console.warn("Could not read local firebase-applet-config.json, falling back:", error);
}
if (!import_firebase_admin.default.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : void 0;
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    console.log("[Firebase Admin] Initializing with environment Service Account.");
    import_firebase_admin.default.initializeApp({
      credential: import_firebase_admin.default.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
  } else {
    console.log("[Firebase Admin] Initializing with default project credentials.");
    import_firebase_admin.default.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || firebaseProjectId
    });
  }
}
var getAdminDb = () => {
  const dbId = firestoreDatabaseId || process.env.FIRESTORE_DATABASE_ID;
  return dbId ? (0, import_firestore.getFirestore)(import_firebase_admin.default.app(), dbId) : (0, import_firestore.getFirestore)();
};
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
var allowMockAuth = process.env.ALCO_ALLOW_MOCK_AUTH === "true" || process.env.NODE_ENV !== "production";
var adminConfigStore = {};
async function startServer() {
  const app = (0, import_express.default)();
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  const authenticate = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
      }
      const token = authHeader.split(" ")[1];
      if (token === "mock-token" || token === "local-mock-token" || token === "undefined" || token === "null" || token.split(".").length !== 3) {
        if (!allowMockAuth) {
          return res.status(401).json({
            error: "Unauthorized: Invalid token",
            message: "Production mode requires a valid Firebase token."
          });
        }
        req.user = { uid: "mock-userId", name: "Kreatif Alco", email: "user@alco.com" };
        return next();
      }
      try {
        const decodedToken = await import_firebase_admin.default.auth().verifyIdToken(token);
        req.user = decodedToken;
      } catch (err) {
        if (!allowMockAuth) {
          return res.status(401).json({
            error: "Unauthorized: Invalid token",
            message: "Production mode requires a valid Firebase token."
          });
        }
        console.warn("[Firebase Admin Verification Failed] Falling back to mock user profile:", err?.message || err);
        req.user = { uid: "mock-userId", name: "Kreatif Alco", email: "user@alco.com" };
      }
      next();
    } catch (error) {
      if (!allowMockAuth) {
        return res.status(401).json({
          error: "Unauthorized: Invalid token",
          message: "Production mode requires a valid Firebase token."
        });
      }
      console.error("Auth Middleware Error, continuing with mock user:", error);
      req.user = { uid: "mock-userId", name: "Kreatif Alco", email: "user@alco.com" };
      next();
    }
  };
  app.get("/api/user/config", authenticate, async (req, res) => {
    try {
      let isDemoMode = true;
      let hasApiKey = false;
      let geminiApiKey = null;
      try {
        const settingsDoc = await getAdminDb().collection("userSettings").doc(req.user.uid).get();
        if (settingsDoc.exists) {
          const docData = settingsDoc.data();
          geminiApiKey = docData?.geminiApiKey || null;
          isDemoMode = docData?.isDemoMode !== false;
          hasApiKey = !!geminiApiKey;
          if (!adminConfigStore[req.user.uid]) {
            adminConfigStore[req.user.uid] = {};
          }
          adminConfigStore[req.user.uid].geminiApiKey = geminiApiKey;
          adminConfigStore[req.user.uid].isDemoMode = isDemoMode;
        } else {
          const memData = adminConfigStore[req.user.uid];
          geminiApiKey = memData?.geminiApiKey || null;
          isDemoMode = memData?.isDemoMode !== false;
          hasApiKey = !!geminiApiKey;
        }
      } catch (dbError) {
        console.warn("[Firestore Read Fallback] Could not retrieve userSettings inside GET config, using memory fallback:", dbError);
        const memData = adminConfigStore[req.user.uid];
        geminiApiKey = memData?.geminiApiKey || null;
        isDemoMode = memData?.isDemoMode !== false;
        hasApiKey = !!geminiApiKey;
      }
      res.json({
        onboardingComplete: true,
        hasApiKey: hasApiKey || !!process.env.GEMINI_API_KEY,
        isDemoMode
      });
    } catch (error) {
      console.error("GET /api/user/config error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/user/config", authenticate, async (req, res) => {
    try {
      const { geminiApiKey, isDemoMode } = req.body;
      const configData = {
        geminiApiKey: geminiApiKey || null,
        isDemoMode: isDemoMode !== false,
        onboardingComplete: true,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!adminConfigStore[req.user.uid]) {
        adminConfigStore[req.user.uid] = {};
      }
      Object.assign(adminConfigStore[req.user.uid], configData);
      try {
        await getAdminDb().collection("userSettings").doc(req.user.uid).set(configData, { merge: true });
      } catch (dbError) {
        console.warn("[Firestore Write Fallback] Failed to store config in Firestore, fallback to local memory:", dbError);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("POST /api/user/config error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  const getDynamicApiUrl = (req) => {
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    return `${protocol}://${host}`;
  };
  app.get("/api/user/api-access", authenticate, async (req, res) => {
    try {
      const userId = req.user.uid;
      let apiKey = null;
      try {
        const settingsDoc = await getAdminDb().collection("userSettings").doc(userId).get();
        const data = settingsDoc.exists ? settingsDoc.data() : null;
        apiKey = data?.apiKey || null;
        if (apiKey) {
          if (!adminConfigStore[userId]) adminConfigStore[userId] = {};
          adminConfigStore[userId].apiKey = apiKey;
        }
      } catch (dbError) {
        console.warn("[Firestore Read Fallback] Falling back to memory configuration for userSettings:", dbError);
        const data = adminConfigStore[userId] || null;
        apiKey = data?.apiKey || null;
      }
      const apiUrl = getDynamicApiUrl(req);
      const connectionString = apiKey ? `alco://connect?url=${encodeURIComponent(apiUrl)}&key=${apiKey}` : null;
      res.json({
        success: true,
        apiKey,
        apiUrl,
        connectionString
      });
    } catch (error) {
      console.error("Error retrieving API Access:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/user/api-access/generate", authenticate, async (req, res) => {
    try {
      const userId = req.user.uid;
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let keySuffix = "";
      for (let i = 0; i < 24; i++) {
        keySuffix += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      const newApiKey = `alco_${keySuffix}`;
      if (!adminConfigStore[userId]) {
        adminConfigStore[userId] = {};
      }
      adminConfigStore[userId].apiKey = newApiKey;
      adminConfigStore[userId].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      try {
        await getAdminDb().collection("userSettings").doc(userId).set({
          apiKey: newApiKey,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
      } catch (dbError) {
        console.warn("[Firestore Write Fallback] Failed to store API key in Firestore, fallback to local memory:", dbError);
      }
      const apiUrl = getDynamicApiUrl(req);
      const connectionString = `alco://connect?url=${encodeURIComponent(apiUrl)}&key=${newApiKey}`;
      res.json({
        success: true,
        apiKey: newApiKey,
        apiUrl,
        connectionString
      });
    } catch (error) {
      console.error("Error generating API key:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/user/api-access/revoke", authenticate, async (req, res) => {
    try {
      const userId = req.user.uid;
      if (adminConfigStore[userId]) {
        delete adminConfigStore[userId].apiKey;
        adminConfigStore[userId].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      try {
        await getAdminDb().collection("userSettings").doc(userId).set({
          apiKey: import_firebase_admin.default.firestore.FieldValue.delete(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }, { merge: true });
      } catch (dbError) {
        console.warn("[Firestore Write Fallback] Failed to delete API key in Firestore, fallback to local memory:", dbError);
      }
      res.json({
        success: true,
        message: "API key berhasil dicabut."
      });
    } catch (error) {
      console.error("Error revoking API key:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  const apiAuth = async (req, res, next) => {
    try {
      const apiKey = req.headers["x-api-key"] || req.headers["X-API-Key"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: "API_KEY_REQUIRED",
          message: "API key diperlukan. Sertakan dalam header 'x-api-key' atau 'Authorization: Bearer <key>'."
        });
      }
      let userId = null;
      for (const [uid, config] of Object.entries(adminConfigStore)) {
        if (config && config.apiKey === apiKey) {
          userId = uid;
          break;
        }
      }
      if (!userId) {
        try {
          const settingsSnapshot = await getAdminDb().collection("userSettings").where("apiKey", "==", apiKey).limit(1).get();
          if (!settingsSnapshot.empty) {
            const doc = settingsSnapshot.docs[0];
            userId = doc.id;
            if (!adminConfigStore[userId]) {
              adminConfigStore[userId] = {};
            }
            adminConfigStore[userId].apiKey = apiKey;
            adminConfigStore[userId].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          }
        } catch (dbError) {
          console.warn("[Firestore Query Fallback] Failed to query apiKey in Firestore:", dbError);
        }
      }
      if (!userId) {
        if (!allowMockAuth) {
          return res.status(401).json({
            success: false,
            error: "INVALID_API_KEY",
            message: "API key tidak dikenali pada mode produksi."
          });
        }
        return res.status(401).json({
          success: false,
          error: "INVALID_API_KEY",
          message: "API key yang diberikan tidak valid atau telah dicabut."
        });
      }
      req.userId = userId;
      req.apiKey = apiKey;
      next();
    } catch (error) {
      console.error("API Auth Error:", error);
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Terjadi kesalahan internal pada server saat memvalidasi API key."
      });
    }
  };
  app.get("/api/bootstrap", async (req, res) => {
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
          description: "Query list of all configured branding workspaces under validated user account",
          authRequired: true
        },
        {
          path: "/api/projects",
          method: "GET",
          description: "Query list of all active copywriting/marketer projects under validated user account",
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
  app.get("/api/health", apiAuth, async (req, res) => {
    res.json({
      status: "ok",
      message: "Sistem API Alco berjalan dengan baik.",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId: req.userId
    });
  });
  app.get("/api/brands", apiAuth, async (req, res) => {
    try {
      let brands = [];
      try {
        const projectsSnapshot = await getAdminDb().collection("projects").where("userId", "==", req.userId).get();
        brands = projectsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            brandName: data.brandFoundationData?.brandName || data.name || "Brand Tanpa Nama",
            industry: data.nicheData?.input?.interest || data.brandFoundationData?.industry || "Belum Ditentukan",
            tagline: data.brandFoundationData?.brandFeel || "",
            primaryColor: data.brandFoundationData?.colors?.primary || "#4f46e5",
            secondaryColor: data.brandFoundationData?.colors?.secondary || "#0f172a",
            accentColor: data.brandFoundationData?.colors?.accent || "#f59e0b",
            createdAt: data.createdAt ? data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt : null
          };
        });
      } catch (dbError) {
        console.error("[Firestore Error] Gagal membaca brands dari Firestore:", dbError);
        return res.status(500).json({
          success: false,
          error: "DATABASE_ERROR",
          message: "Akses database gagal. Mohon pastikan konektivitas dan skema Firestore Anda dikonfigurasi dengan baik."
        });
      }
      res.json({
        success: true,
        count: brands.length,
        data: brands
      });
    } catch (error) {
      console.error("GET /api/brands error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/projects", apiAuth, async (req, res) => {
    try {
      let projects = [];
      try {
        const projectsSnapshot = await getAdminDb().collection("projects").where("userId", "==", req.userId).get();
        projects = projectsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            currentStep: data.currentStep || 1,
            createdAt: data.createdAt ? data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt : null
          };
        });
      } catch (dbError) {
        console.error("[Firestore Error] Gagal membaca projects dari Firestore:", dbError);
        return res.status(500).json({
          success: false,
          error: "DATABASE_ERROR",
          message: "Akses database gagal. Mohon pastikan konektivitas dan skema Firestore Anda dikonfigurasi dengan baik."
        });
      }
      res.json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (error) {
      console.error("GET /api/projects error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/context/content/:brandId", apiAuth, async (req, res) => {
    try {
      const projectDoc = await getAdminDb().collection("projects").doc(req.params.brandId).get();
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
    } catch (error) {
      console.error("GET /api/context/content error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/context/ads/:brandId", apiAuth, async (req, res) => {
    try {
      const projectDoc = await getAdminDb().collection("projects").doc(req.params.brandId).get();
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
    } catch (error) {
      console.error("GET /api/context/ads error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/context/product/:brandId", apiAuth, async (req, res) => {
    try {
      const projectDoc = await getAdminDb().collection("projects").doc(req.params.brandId).get();
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
    } catch (error) {
      console.error("GET /api/context/product error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/context/copy/:brandId", apiAuth, async (req, res) => {
    try {
      const projectDoc = await getAdminDb().collection("projects").doc(req.params.brandId).get();
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
    } catch (error) {
      console.error("GET /api/context/copy error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl) {
        return res.status(400).send("URL parameter is required");
      }
      console.log(`[Proxy Image] Fetching: ${imageUrl}`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (error) {
      console.error("Proxy Image Error:", error);
      res.status(500).send(error.message);
    }
  });
  app.post("/api/ai/generate", authenticate, async (req, res) => {
    try {
      const { prompt, systemInstruction } = req.body;
      const userId = req.user.uid;
      const apiKey = req.headers["x-gemini-api-key"] || req.headers["X-Gemini-API-Key"];
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
        return res.status(403).json({
          error: "API_KEY_REQUIRED",
          message: "Akses AI Ditolak. Anda wajib menyediakan Gemini API Key Anda sendiri."
        });
      }
      const aiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      console.log(`[AI Request] User: ${userId} | Model: gemini-3.5-flash | Prompt: ${prompt.substring(0, 50)}...`);
      const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let attempts = 0;
      const maxAttempts = 4;
      let lastError = null;
      while (attempts < maxAttempts) {
        const modelToUse = modelsToTry[attempts % modelsToTry.length];
        try {
          const result = await aiClient.models.generateContent({
            model: modelToUse,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction || "You are Alco Creative System's AI Business Assistant by Aladzan Corpora. You specialize in digital marketing, sales funnel optimization, and high-converting copywriting. Always provide practical, efficient, and professional advice. Focus on scalable systems and premium brand execution.",
              responseMimeType: "application/json"
            }
          });
          const text = result.text;
          if (!text) {
            throw new Error("AI returned an empty response.");
          }
          return res.json({ text });
        } catch (error) {
          lastError = error;
          attempts++;
          const isInvalidKey = error?.status === 400 || error?.status === 401 || error?.status === 403 || error?.error?.code === 400 || error?.error?.code === 401 || error?.error?.code === 403 || error?.message?.toLowerCase().includes("api key not valid") || error?.message?.toLowerCase().includes("invalid api key") || error?.message?.toLowerCase().includes("unauthorized") || error?.message?.toLowerCase().includes("unauthenticated") || error?.message?.toLowerCase().includes("forbidden") || error?.message?.toLowerCase().includes("key_invalid") || error?.message?.toLowerCase().includes("api_key_invalid") || error?.message?.toLowerCase().includes("not valid") || error?.message?.toLowerCase().includes("authentication credentials") || error?.message?.toLowerCase().includes("access_token_type_unsupported");
          if (isInvalidKey) {
            console.error(`[AI API Key Error] Invalid API Key on model ${modelToUse}:`, error);
            return res.status(403).json({
              error: "API_KEY_INVALID",
              message: "Gemini API Key Anda tidak valid atau tidak memiliki izin akses. Pastikan Anda menyalin kunci resmi kembali dari Google AI Studio dan periksa status kuota/billing kunci Anda."
            });
          }
          const isRateLimit = error?.status === 429 || error?.error?.code === 429 || error?.message?.includes("429") || error?.message?.includes("quota") || error?.message?.includes("RESOURCE_EXHAUSTED");
          if (isRateLimit) {
            console.error(`[AI Rate Limit] Mode: ${modelToUse}`, error);
            if (attempts < maxAttempts) {
              const delay = 1e3;
              const nextModel = modelsToTry[attempts % modelsToTry.length];
              console.warn(`[AI Rate Limit Fallback] Rate limited on ${modelToUse}. Retrying with fallback model ${nextModel} in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              continue;
            }
            let retryAfter = "someday";
            if (error?.error?.details) {
              const retryInfo = error.error.details.find((d) => d["@type"]?.includes("RetryInfo"));
              if (retryInfo?.retryDelay) {
                retryAfter = retryInfo.retryDelay;
              }
            }
            return res.status(429).json({
              error: "AI Quota Exceeded",
              message: `You have exceeded your daily Gemini API quota. Please try again after ${retryAfter}.`,
              details: error.message,
              retryAfter
            });
          }
          const isRetryable = error?.message?.includes("503") || error?.status === 503 || error?.error?.code === 503 || error?.message?.includes("high demand") || error?.message?.includes("UNAVAILABLE") || error?.message?.toLowerCase().includes("overloaded");
          if (isRetryable && attempts < maxAttempts) {
            const delay = Math.pow(2, attempts) * 1e3;
            const nextModel = modelsToTry[attempts % modelsToTry.length];
            console.warn(`[AI Retry] Attempt ${attempts} failed for ${modelToUse} with transient error. Retrying with ${nextModel} in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          if (attempts < maxAttempts) {
            const delay = 1e3;
            const nextModel = modelsToTry[attempts % modelsToTry.length];
            console.warn(`[AI Retry] General error with ${modelToUse}. Retrying with fallback model ${nextModel} in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          break;
        }
      }
      throw lastError;
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "An error occurred during AI generation." });
    }
  });
  app.post("/api/v1/execute", async (req, res) => {
    try {
      const { prompt, systemInstruction, responseMimeType } = req.body;
      let apiKey = req.headers["x-gemini-api-key"] || req.headers["X-Gemini-API-Key"] || req.headers["x-api-key"];
      if (!apiKey) {
        const storedConfig = Object.values(adminConfigStore).find((entry) => entry?.geminiApiKey);
        if (storedConfig) {
          apiKey = storedConfig.geminiApiKey;
        }
      }
      if (!apiKey) {
        apiKey = process.env.GEMINI_API_KEY;
      }
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
        return res.status(403).json({
          success: false,
          error: "API_KEY_REQUIRED",
          message: "API Key Gemini tidak ditemukan. Silakan masukkan kunci API Anda di header 'x-gemini-api-key' atau 'x-api-key', atau atur di Panel Dashboard Anda."
        });
      }
      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "PROMPT_REQUIRED",
          message: "Kolom request body wajib menyertakan 'prompt'."
        });
      }
      const aiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build-api-v1"
          }
        }
      });
      console.log(`[Public API v1] Executing request. Prompt prefix: ${prompt.substring(0, 50)}...`);
      const modelToUse = "gemini-3.5-flash";
      const configObj = {
        systemInstruction: systemInstruction || "You are Alco Creative System's API Assistant. Provide practical, accurate and detailed response."
      };
      if (responseMimeType) {
        configObj.responseMimeType = responseMimeType;
      }
      const result = await aiClient.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: configObj
      });
      const text = result.text;
      if (!text) {
        throw new Error("Gemini returned an empty response.");
      }
      let parsedPayload = text;
      let isJson = false;
      if (responseMimeType === "application/json" || text.trim().startsWith("{") || text.trim().startsWith("[")) {
        try {
          const cleanText = text.replace(/```json\n?|```/g, "").trim();
          parsedPayload = JSON.parse(cleanText);
          isJson = true;
        } catch (e) {
        }
      }
      return res.json({
        success: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        model: modelToUse,
        isJsonResponse: isJson,
        data: parsedPayload
      });
    } catch (error) {
      console.error("[Public API v1 Error]:", error);
      res.status(500).json({
        success: false,
        error: error.message || "An unexpected error occurred during API execution."
      });
    }
  });
  app.post("/api/ai/stream", async (req, res) => {
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
startServer().catch(console.error);
//# sourceMappingURL=server.cjs.map
