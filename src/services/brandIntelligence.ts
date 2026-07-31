import { doc, getDoc, updateDoc, db } from "@/lib/firebase";

export interface BrandIntelligence {
  schemaVersion: string;

  projectInfo: {
    projectId: string;
    projectName: string;
    createdAt: string;
    updatedAt: string;
  };

  brandIdentity: {
    brandName: string;
    industry: string;
    niche: string;
    subNiche: string;
    mission: string;
    vision: string;
    positioning: string;
    usp: string;
    brandValues: string[];
    brandPersonality: string[];
  };

  audience: {
    primaryAudience: string;
    secondaryAudience: string;
    demographics: Record<string, any>;
    psychographics: Record<string, any>;
    awarenessLevel: string;
    objections: string[];
    desires: string[];
    frustrations: string[];
    painPoints: string[];
  };

  products: any[];

  offers: any[];

  competitors: any[];

  contentStrategy: {
    contentPillars: string[];
    contentThemes: string[];
    contentAngles: string[];
    storytellingFrameworks: string[];
    ctaFrameworks: string[];
  };

  messaging: {
    toneOfVoice: Record<string, any>;
    copyGuidelines: string[];
    messagingRules: string[];
    bannedWords: string[];
    preferredWords: string[];
  };

  marketInsights: {
    opportunities: string[];
    threats: string[];
    trends: string[];
    validationFindings: string[];
  };

  brandRules: string[];

  brandMemory: string[];

  generatedAssets: {
    hooks: string[];
    captions: string[];
    headlines: string[];
    scripts: string[];
    adCopies: string[];
  };
}

/**
 * Creates an empty default Brand Intelligence schema
 */
export function createDefaultBrandIntelligence(project: any = {}): BrandIntelligence {
  return {
    schemaVersion: "1.0",
    projectInfo: {
      projectId: project?.id || "",
      projectName: project?.name || "Rencana Strategis Tanpa Nama",
      createdAt: project?.createdAt || new Date().toISOString(),
      updatedAt: project?.updatedAt || new Date().toISOString(),
    },
    brandIdentity: {
      brandName: "",
      industry: "",
      niche: "",
      subNiche: "",
      mission: "",
      vision: "",
      positioning: "",
      usp: "",
      brandValues: [],
      brandPersonality: [],
    },
    audience: {
      primaryAudience: "",
      secondaryAudience: "",
      demographics: {},
      psychographics: {},
      awarenessLevel: "",
      objections: [],
      desires: [],
      frustrations: [],
      painPoints: [],
    },
    products: [],
    offers: [],
    competitors: [],
    contentStrategy: {
      contentPillars: [],
      contentThemes: [],
      contentAngles: [],
      storytellingFrameworks: [],
      ctaFrameworks: [],
    },
    messaging: {
      toneOfVoice: {},
      copyGuidelines: [],
      messagingRules: [],
      bannedWords: [],
      preferredWords: [],
    },
    marketInsights: {
      opportunities: [],
      threats: [],
      trends: [],
      validationFindings: [],
    },
    brandRules: [],
    brandMemory: [],
    generatedAssets: {
      hooks: [],
      captions: [],
      headlines: [],
      scripts: [],
      adCopies: [],
    },
  };
}

/**
 * MERGE WORKFLOW RESULT - Primary engine that turns flat project step outcomes into Brand Intelligence
 */
export function mergeWorkflowResult(project: any): BrandIntelligence {
  const bi = project?.brandIntelligence ? { ...createDefaultBrandIntelligence(project), ...project.brandIntelligence } : createDefaultBrandIntelligence(project);

  // Synchronize dynamic updates back over metadata
  bi.projectInfo.projectId = project?.id || bi.projectInfo.projectId;
  bi.projectInfo.projectName = project?.name || bi.projectInfo.projectName;
  bi.projectInfo.updatedAt = project?.updatedAt || new Date().toISOString();

  // 1. STEP 1: Riset Niche Pasar -> Map to Brand Identity
  if (project?.nicheData) {
    const selectedNiche = project.nicheData.selectedOption;
    bi.brandIdentity.niche = selectedNiche?.name || project.nicheData.input?.interest || bi.brandIdentity.niche;
    bi.brandIdentity.industry = selectedNiche?.name || project.nicheData.input?.interest || bi.brandIdentity.industry;
    bi.brandIdentity.subNiche = selectedNiche?.summary || bi.brandIdentity.subNiche;
  }

  // 2. STEP 2: Karakter Pelanggan -> Map to Audience
  if (project?.audienceData) {
    const selectedAudience = project.audienceData.selectedOption;
    bi.audience.primaryAudience = selectedAudience?.persona_name || project.audienceData.input?.audienceGoal || bi.audience.primaryAudience;
    
    if (project.audienceData.input?.demographicsGoal) {
      bi.audience.demographics = {
        ...bi.audience.demographics,
        targetDemographics: project.audienceData.input.demographicsGoal,
      };
    }

    if (selectedAudience) {
      bi.audience.psychographics = {
        ...bi.audience.psychographics,
        buying_behavior: selectedAudience.buying_behavior || "",
        trust_triggers: selectedAudience.trust_triggers || [],
        emotional_triggers: selectedAudience.emotional_triggers || [],
        analysis: selectedAudience.analysis || "",
      };
    }
  }

  // 3. STEP 3: Pain Points -> Map to Audience
  if (project?.painPointData) {
    const selectedPain = project.painPointData.selectedOption;
    if (selectedPain) {
      bi.audience.painPoints = selectedPain.top_pain_points || [];
      bi.audience.frustrations = selectedPain.top_pain_points || [];
      bi.audience.demographics = {
        ...bi.audience.demographics,
        profitable_problem: selectedPain.profitable_problem || "",
        urgency_score: selectedPain.urgency_score || 0,
        emotional_score: selectedPain.emotional_score || 0,
      };
    }
  }

  // 4. STEP 4: Market Validation -> Map to Market Insights
  if (project?.validationData) {
    const selectedVal = project.validationData.selectedOption;
    if (selectedVal) {
      bi.marketInsights.validationFindings = selectedVal.market_gap ? [selectedVal.market_gap] : [];
      bi.marketInsights.opportunities = selectedVal.opportunity_recommendation ? [selectedVal.opportunity_recommendation] : [];
      bi.marketInsights.trends = [
        `Feasibility Status: ${selectedVal.feasibility_status || 'HIGH'}`,
        `Validation Score: ${selectedVal.validation_score || 0}/10`
      ];
    }
  }

  // 5. STEP 5: Positioning Premium -> Map to Brand Identity
  if (project?.positioningData) {
    const selectedPos = project.positioningData.selectedOption;
    if (selectedPos) {
      bi.brandIdentity.positioning = selectedPos.positioning_statement || "";
      bi.brandIdentity.usp = selectedPos.USP || "";
      bi.brandIdentity.subNiche = selectedPos.unique_mechanism || bi.brandIdentity.subNiche;
      bi.brandIdentity.mission = selectedPos.value_proposition || bi.brandIdentity.mission;
    }
  }

  // 6. STEP 6: Offer Creation -> Map to Offers list
  if (project?.offerData) {
    const selectedOffer = project.offerData.selectedOption;
    if (selectedOffer) {
      // Find and merge/update rather than appending duplicatively
      const existingOfferIdx = bi.offers.findIndex((o: any) => o.id === selectedOffer.id || o.main_offer === selectedOffer.main_offer);
      if (existingOfferIdx >= 0) {
        bi.offers[existingOfferIdx] = selectedOffer;
      } else {
        bi.offers.push(selectedOffer);
      }
    }
  }

  // 7. STEP 7: Marketing Angles -> Map to Content Strategy & CTA Frameworks
  if (project?.marketingAngles) {
    const selectedAngleSet = project.marketingAngles.selectedOption;
    if (selectedAngleSet) {
      const angles = selectedAngleSet.angles || [];
      
      const newAngles = angles.map((a: any) => a.title || a.angle_set_title).filter(Boolean);
      const newCtas = angles.map((a: any) => a.cta).filter(Boolean);

      bi.contentStrategy.contentAngles = Array.from(new Set([...bi.contentStrategy.contentAngles, ...newAngles]));
      bi.contentStrategy.ctaFrameworks = Array.from(new Set([...bi.contentStrategy.ctaFrameworks, ...newCtas]));
      bi.contentStrategy.contentThemes = [selectedAngleSet.angle_set_title || "Creative Angles Set"];

      // Collect Hooks directly into Generated Assets
      const newHooks = angles.map((a: any) => a.hook).filter(Boolean);
      bi.generatedAssets.hooks = Array.from(new Set([...bi.generatedAssets.hooks, ...newHooks]));
    }
  }

  // 8. STEP 8: Copy Direction -> Map to Messaging Tone/Guidelines
  if (project?.copyDirection) {
    const selectedCopy = project.copyDirection.selectedOption;
    if (selectedCopy) {
      bi.messaging.toneOfVoice = {
        ...bi.messaging.toneOfVoice,
        tone: selectedCopy.tone || "",
        style: selectedCopy.style || "",
        structure_analysis: selectedCopy.structure_analysis || "",
      };
      
      bi.messaging.copyGuidelines = Array.from(new Set([
        ...bi.messaging.copyGuidelines,
        selectedCopy.summary || "",
        `Structure: ${selectedCopy.structure_analysis || ""}`
      ].filter(Boolean)));
    }
  }

  // 9. STEP 10: Brand Foundation Step -> Map to Brand Identity Identity, Personality, Values
  if (project?.brandFoundationData) {
    const brandData = project.brandFoundationData;
    bi.brandIdentity.brandName = brandData.brandName || bi.brandIdentity.brandName;
    bi.brandIdentity.mission = brandData.brandFeel || bi.brandIdentity.mission;
    bi.brandIdentity.brandPersonality = brandData.brandPersonality || bi.brandIdentity.brandPersonality;
    bi.brandIdentity.brandValues = brandData.communicationStyle || bi.brandIdentity.brandValues;
    
    // Add guidelines
    if (brandData.visualDirection) {
      bi.contentStrategy.contentPillars = Array.from(new Set([...bi.contentStrategy.contentPillars, brandData.visualDirection]));
    }
    if (brandData.advertiserFigure) {
      bi.messaging.messagingRules = Array.from(new Set([...bi.messaging.messagingRules, `Advertiser Figure: ${brandData.advertiserFigure}`]));
    }

    if (brandData.aiAnalysis) {
      const anal = brandData.aiAnalysis;
      if (anal.recommendedBrandDirection) {
        bi.messaging.copyGuidelines = Array.from(new Set([...bi.messaging.copyGuidelines, anal.recommendedBrandDirection]));
      }
      if (anal.brandConsistencyWarning) {
        bi.brandRules = Array.from(new Set([...bi.brandRules, anal.brandConsistencyWarning]));
      }
      if (anal.recommendedVisualStyle) {
        bi.messaging.copyGuidelines = Array.from(new Set([...bi.messaging.copyGuidelines, `Visual Style Guide: ${anal.recommendedVisualStyle}`]));
      }
    }
  }

  // 10. AdsContentStep results -> Map to Generated Assets (headlines, adCopies, and hook arrays)
  if (project?.adsGeneratedAngles && Array.isArray(project.adsGeneratedAngles)) {
    const angles = project.adsGeneratedAngles;
    
    const scrollH = angles.map((a: any) => a.scroll_stopper_hook).filter(Boolean);
    const viralH = angles.map((a: any) => a.viral_hook).filter(Boolean);
    const emoH = angles.map((a: any) => a.emotional_hook).filter(Boolean);
    const heads = angles.flatMap((a: any) => a.headlines || []).filter(Boolean);
    const captions = angles.map((a: any) => a.primary_text || a.caption).filter(Boolean);
    const copies = angles.map((a: any) => {
      const hStr = Array.isArray(a.headlines) ? a.headlines.join(" | ") : (a.headline || "");
      return `${hStr}\n\n${a.primary_text || a.caption || ""}`;
    }).filter(Boolean);

    bi.generatedAssets.hooks = Array.from(new Set([...bi.generatedAssets.hooks, ...scrollH, ...viralH, ...emoH]));
    bi.generatedAssets.headlines = Array.from(new Set([...bi.generatedAssets.headlines, ...heads]));
    bi.generatedAssets.captions = Array.from(new Set([...bi.generatedAssets.captions, ...captions]));
    bi.generatedAssets.adCopies = Array.from(new Set([...bi.generatedAssets.adCopies, ...copies]));
  }

  return bi;
}

/**
 * Load Brand Intelligence data for a project ID
 */
export async function loadBrandIntelligence(projectId: string): Promise<BrandIntelligence | null> {
  try {
    const docSnap = await getDoc(doc(db, "projects", projectId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure merged and constructed from current database fields
      return mergeWorkflowResult({ id: projectId, ...data });
    }
  } catch (error) {
    console.error("[BrandIntelligence] Load failed:", error);
  }
  return null;
}

/**
 * Writes or saves updated Brand Intelligence directly to project document state
 */
export async function saveBrandIntelligence(projectId: string, bi: BrandIntelligence): Promise<boolean> {
  try {
    const docRef = doc(db, "projects", projectId);
    await updateDoc(docRef, {
      brandIntelligence: bi,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("[BrandIntelligence] Save failed:", error);
    return false;
  }
}

/**
 * Perform a delta update to specific brand intelligence fields
 */
export async function updateBrandIntelligence(
  projectId: string,
  updater: (prev: BrandIntelligence) => BrandIntelligence
): Promise<BrandIntelligence | null> {
  try {
    const docRef = doc(db, "projects", projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentProj = docSnap.data();
      const currentBi = currentProj.brandIntelligence || mergeWorkflowResult({ id: projectId, ...currentProj });
      const updatedBi = updater(currentBi);
      
      await updateDoc(docRef, {
        brandIntelligence: updatedBi,
        updatedAt: new Date().toISOString()
      });
      return updatedBi;
    }
  } catch (error) {
    console.error("[BrandIntelligence] Update failed:", error);
  }
  return null;
}

/**
 * Stringifies Brand Intelligence schema as a downloadable/clipboard JSON file
 */
export function exportBrandIntelligence(bi: BrandIntelligence): string {
  return JSON.stringify(bi, null, 2);
}

/**
 * Imports external Brand Intelligence schema string and merges it into the current project document
 */
export async function importBrandIntelligence(projectId: string, jsonString: string): Promise<BrandIntelligence> {
  const parsed = JSON.parse(jsonString);
  if (parsed.schemaVersion !== "1.0" && !parsed.brandIdentity) {
    throw new Error("Invalid Brand Intelligence schema version. Mismatched JSON layout.");
  }
  
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Target project database file not found.");
  }

  const currentProj = docSnap.data();
  const currentBi = currentProj.brandIntelligence || mergeWorkflowResult({ id: projectId, ...currentProj });

  const mergedBi = {
    ...currentBi,
    ...parsed,
    projectInfo: {
      ...currentBi.projectInfo,
      projectId,
      updatedAt: new Date().toISOString()
    }
  };

  await updateDoc(docRef, {
    brandIntelligence: mergedBi,
    updatedAt: new Date().toISOString()
  });

  return mergedBi;
}
