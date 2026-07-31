// Custom local-first Firebase configuration
// Completely independent of Firebase cloud servers, using localStorage for 100% local operation
import { toast } from "sonner";

// --- TYPES & INTERFACES ---
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
}

// Mock auth token placeholder
const MOCK_TOKEN = "local-mock-token";

class MockAuth {
  private listeners: Set<(user: User | null) => void> = new Set();
  private cachedUser: User | null = null;
  private lastProfileStr: string | null = null;

  get currentUser(): User | null {
    const profileStr = localStorage.getItem("alco_user_profile");
    if (!profileStr) {
      this.cachedUser = null;
      this.lastProfileStr = null;
      return null;
    }
    if (profileStr === this.lastProfileStr && this.cachedUser) {
      return this.cachedUser;
    }
    try {
      const profile = JSON.parse(profileStr);
      this.lastProfileStr = profileStr;
      this.cachedUser = {
        uid: "local-user-id",
        displayName: profile.name || "User",
        email: profile.brandName || "Brand",
        photoURL: null,
        getIdToken: async () => MOCK_TOKEN
      };
      return this.cachedUser;
    } catch {
      this.cachedUser = null;
      this.lastProfileStr = null;
      return null;
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    this.listeners.add(callback);
    // Instant callback with current state
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  async signOut() {
    localStorage.removeItem("alco_user_profile");
    localStorage.removeItem("alco_gemini_api_key");
    this.triggerListeners();
    // Dispatch events to let App.tsx know
    window.dispatchEvent(new Event("alco_api_key_changed"));
    window.dispatchEvent(new Event("alco_auth_state_changed"));
    toast.success("Berhasil keluar dari aplikasi.");
  }

  triggerListeners() {
    const user = this.currentUser;
    this.listeners.forEach(cb => {
      try {
        cb(user);
      } catch (e) {
        console.error("Error in onAuthStateChanged listener:", e);
      }
    });
  }
}

// Initialize standard client-side Firebase Auth as mock
export const auth = new MockAuth();
export const googleProvider = {};

// Standard compatibility classes
export class GoogleAuthProvider {}

export const signInWithPopup = async (_authInstance: any, _provider: any) => {
  toast.error("Metode Google Login dinonaktifkan. Silakan gunakan sistem onboarding.");
  throw new Error("Google Login disabled");
};

export const signInWithGoogle = () => signInWithPopup(null, null);

export function onAuthStateChanged(authInstance: any, callback: (user: User | null) => void) {
  if (authInstance && typeof authInstance.onAuthStateChanged === "function") {
    return authInstance.onAuthStateChanged(callback);
  }
  return auth.onAuthStateChanged(callback);
}

// --- LOCAL STORAGE HELPERS FOR COMPLETE OFF-CLOUD DATA ---
function getLocalDB(): Record<string, any> {
  try {
    const data = localStorage.getItem("alco_local_db");
    const parsed = data ? JSON.parse(data) : {};
    
    // Auto-seed default design system & creative planning project
    if (Object.keys(parsed).length === 0) {
      parsed["projects/template-elite-pipeline"] = {
        userId: "local-user-id",
        name: "Elite Agency Hyper-Growth Pipeline 🚀",
        currentStep: 8,
        nicheData: {
          selectedOption: {
            name: "Premium Digital Agency",
            description: "Strategi digital instan bagi pebisnis digital berskala tinggi dengan konversi copy tingkat lanjut"
          }
        },
        toneOfVoice: "Premium Executive",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("alco_local_db", JSON.stringify(parsed));
    }
    return parsed;
  } catch (error) {
    console.error("Local DB read failed:", error);
    return {};
  }
}

function saveLocalDB(data: Record<string, any>) {
  try {
    localStorage.setItem("alco_local_db", JSON.stringify(data));
  } catch (error) {
    console.error("Local DB save failed:", error);
  }
}

function deepMerge(target: any, source: any): any {
  const merged = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      merged[key] = deepMerge(merged[key] || {}, source[key]);
    } else {
      merged[key] = source[key];
    }
  }
  return merged;
}

// --- FIRESTORE DATABASE MOCK (COMPLETELY LOCAL & HIGH SPEED) ---
class MockFirestore {
  type = "firestore";
}

export const db = new MockFirestore();

export function initializeApp(_config?: any) {
  return {};
}

export function getAuth(_app?: any) {
  return auth;
}

export function getFirestore(_app?: any, _databaseId?: string) {
  return db;
}

export interface DocumentReference {
  path: string;
}

export interface CollectionReference {
  path: string;
  constraints?: any[];
}

export function doc(_database: MockFirestore, collectionPath: string, ...documentPaths: string[]): DocumentReference {
  const fullPath = [collectionPath, ...documentPaths].filter(Boolean).join("/");
  return { path: fullPath };
}

export function collection(_database: MockFirestore, collectionPath: string, ...documentPaths: string[]): CollectionReference {
  const fullPath = [collectionPath, ...documentPaths].filter(Boolean).join("/");
  return { path: fullPath };
}

export function query(collectionRef: CollectionReference, ...constraints: any[]): CollectionReference {
  return {
    path: collectionRef.path,
    constraints: [...(collectionRef.constraints || []), ...constraints]
  };
}

export function where(field: string, op: string, value: any) {
  return { type: "where", field, op, value };
}

export function serverTimestamp() {
  return new Date().toISOString();
}

// Snapshot listeners registry
const snapshotSubscribers: Record<string, Set<(doc: any) => void>> = {};

export function onSnapshot(docRef: DocumentReference, callback: (snapshot: any) => void) {
  const { path } = docRef;
  if (!snapshotSubscribers[path]) {
    snapshotSubscribers[path] = new Set();
  }
  snapshotSubscribers[path].add(callback);

  // Send initial value instantly
  const dbState = getLocalDB();
  const data = dbState[path] || null;
  const docId = path.split("/").pop();

  setTimeout(() => {
    callback({
      id: docId,
      exists: () => data !== null,
      data: () => data
    });
  }, 0);

  return () => {
    snapshotSubscribers[path]?.delete(callback);
  };
}

function triggerSnapshot(path: string, data: any) {
  const subscribers = snapshotSubscribers[path];
  if (subscribers) {
    const docId = path.split("/").pop();
    const snapshot = {
      id: docId,
      exists: () => data !== null,
      data: () => data
    };
    subscribers.forEach(cb => {
      try {
        cb(snapshot);
      } catch (e) {
        console.error("Error in onSnapshot subscriber:", e);
      }
    });
  }
}

export function getDoc(docRef: DocumentReference) {
  const { path } = docRef;
  const dbState = getLocalDB();
  const data = dbState[path] || null;
  const docId = path.split("/").pop();

  return Promise.resolve({
    id: docId,
    exists: () => data !== null,
    data: () => data
  });
}

export const getDocFromServer = getDoc;

export function setDoc(docRef: DocumentReference, data: any, options?: { merge?: boolean }) {
  const { path } = docRef;
  const dbState = getLocalDB();

  let newData = { ...data };
  if (options?.merge && dbState[path]) {
    newData = deepMerge(dbState[path], data);
  }

  dbState[path] = newData;
  saveLocalDB(dbState);
  triggerSnapshot(path, newData);

  return Promise.resolve();
}

export function updateDoc(docRef: DocumentReference, data: any) {
  const { path } = docRef;
  const dbState = getLocalDB();

  const existing = dbState[path] || {};
  const newData = deepMerge(existing, data);
  dbState[path] = newData;

  saveLocalDB(dbState);
  triggerSnapshot(path, newData);

  return Promise.resolve();
}

export function deleteDoc(docRef: DocumentReference) {
  const { path } = docRef;
  const dbState = getLocalDB();
  delete dbState[path];
  saveLocalDB(dbState);
  triggerSnapshot(path, null);
  return Promise.resolve();
}

export function addDoc(collectionRef: CollectionReference, data: any) {
  const { path: colPath } = collectionRef;
  const generatedId = Math.random().toString(36).substring(2, 15);
  const docPath = `${colPath}/${generatedId}`;

  const dbState = getLocalDB();
  dbState[docPath] = data;
  saveLocalDB(dbState);
  triggerSnapshot(docPath, data);

  return Promise.resolve({ id: generatedId });
}

export function getDocs(queryOrRef: CollectionReference) {
  const { path, constraints = [] } = queryOrRef;
  const dbState = getLocalDB();
  let results: Array<{ id: string; data: any }> = [];

  for (const key of Object.keys(dbState)) {
    if (key.startsWith(path + "/") && key.slice(path.length + 1).indexOf("/") === -1) {
      const docId = key.split("/").pop()!;
      results.push({ id: docId, data: dbState[key] });
    }
  }

  for (const constraint of constraints) {
    if (constraint.type === "where") {
      results = results.filter(item => {
        const val = item.data[constraint.field];
        if (constraint.op === "==") return val === constraint.value;
        if (constraint.op === "!=") return val !== constraint.value;
        return true;
      });
    }
  }

  return Promise.resolve({
    empty: results.length === 0,
    size: results.length,
    docs: results.map(item => ({
      id: item.id,
      exists: () => true,
      data: () => item.data
    }))
  });
}
