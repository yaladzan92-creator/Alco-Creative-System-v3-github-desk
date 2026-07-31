import { BrandIntelligence, mergeWorkflowResult } from "./brandIntelligence";

export interface StrategyBrief {
  schemaVersion: string;
  projectInfo: {
    projectId: string;
    projectName: string;
    createdAt: string;
    updatedAt: string;
  };
  audienceSnapshot: {
    niche: string;
    audience: string;
    mainPain: string;
    mainDesire: string;
  };
  offerBlueprint: {
    positioning: string;
    usp: string;
    mainOffer: string;
    bonuses: string[];
    guarantee: string;
    urgency: string;
  };
  marketingBlueprint: {
    winningAngles: string[];
    hooks: string[];
    copyDirection: string;
    contentAngles: string[];
    ctaFrameworks: string[];
  };
  productForgeInputs: {
    productType: string;
    productPromise: string;
    learningOutcome: string;
    deliveryFormat: string;
    supportStyle: string;
  };
  downstreamNotes: string[];
}

const asString = (value: any): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") {
    if (value.name) return String(value.name);
    if (value.title) return String(value.title);
    if (value.summary) return String(value.summary);
    return JSON.stringify(value);
  }
  return String(value);
};

export function createStrategyBrief(project: any): StrategyBrief {
  const bi: BrandIntelligence = project?.brandIntelligence ? mergeWorkflowResult(project) : mergeWorkflowResult(project);
  const selectedNiche = project?.nicheData?.selectedOption || {};
  const selectedAudience = project?.audienceData?.selectedOption || {};
  const selectedPain = project?.painPointData?.selectedOption || {};
  const selectedPos = project?.positioningData?.selectedOption || {};
  const selectedOffer = project?.offerData?.selectedOption || {};
  const selectedAngles = project?.marketingAngles?.selectedOption || {};
  const selectedCopy = project?.copyDirection?.selectedOption || {};

  return {
    schemaVersion: "1.0",
    projectInfo: {
      projectId: bi.projectInfo.projectId,
      projectName: bi.projectInfo.projectName,
      createdAt: bi.projectInfo.createdAt,
      updatedAt: bi.projectInfo.updatedAt,
    },
    audienceSnapshot: {
      niche: asString(project?.nicheData?.input?.interest || selectedNiche.name || bi.brandIdentity.niche),
      audience: asString(project?.audienceData?.input?.audienceGoal || selectedAudience.persona_name || bi.audience.primaryAudience),
      mainPain: asString(project?.painPointData?.input?.extraContext || selectedPain.profitable_problem || bi.audience.painPoints[0] || ""),
      mainDesire: asString(project?.audienceData?.input?.desires || selectedAudience.desires?.[0] || bi.audience.desires[0] || ""),
    },
    offerBlueprint: {
      positioning: asString(selectedPos.positioning_statement || bi.brandIdentity.positioning),
      usp: asString(selectedPos.USP || bi.brandIdentity.usp),
      mainOffer: asString(selectedOffer.main_offer || bi.offers?.[0]?.main_offer || ""),
      bonuses: Array.isArray(selectedOffer.bonuses) ? selectedOffer.bonuses.filter(Boolean) : [],
      guarantee: asString(selectedOffer.guarantee || ""),
      urgency: asString(selectedOffer.urgency || ""),
    },
    marketingBlueprint: {
      winningAngles: Array.isArray(selectedAngles.angles)
        ? selectedAngles.angles.map((angle: any) => asString(angle.title || angle.hook || angle.strategy)).filter(Boolean)
        : bi.contentStrategy.contentAngles,
      hooks: bi.generatedAssets.hooks.slice(0, 10),
      copyDirection: asString(selectedCopy.summary || selectedCopy.style || selectedCopy.name || ""),
      contentAngles: bi.contentStrategy.contentAngles,
      ctaFrameworks: bi.contentStrategy.ctaFrameworks,
    },
    productForgeInputs: {
      productType: "Produk Digital",
      productPromise: asString(selectedPos.value_proposition || selectedOffer.main_offer || ""),
      learningOutcome: asString(selectedPos.unique_mechanism || selectedOffer.main_offer || ""),
      deliveryFormat: "Template, modul, panduan, atau bundle aset digital",
      supportStyle: "Simple, step-by-step, beginner friendly",
    },
    downstreamNotes: [
      "Gunakan brief ini sebagai input utama Product Forge untuk membangun produk digital.",
      "Gunakan `marketingBlueprint` sebagai bahan Content Engine untuk iklan dan distribusi konten.",
      "Pertahankan bahasa sederhana saat ditampilkan ke user awam.",
    ],
  };
}

export function exportStrategyBrief(project: any): string {
  return JSON.stringify(createStrategyBrief(project), null, 2);
}
