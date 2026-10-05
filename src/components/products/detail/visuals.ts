import type { ComponentType } from "react";
import ChatDemo from "./assist/ChatDemo";
import Integrate from "./assist/Integrate";
import Dashboard from "./assist/Dashboard";
import Steps from "./assist/Steps";
import { FxAlways, FxAnalytics, FxCrawl, FxIntegration, FxRag, FxTenants } from "./assist/Features";
import BriefDemo from "./brief/BriefDemo";
import Condense from "./brief/Condense";
import BriefSteps from "./brief/Steps";
import BriefDashboard from "./brief/Dashboard";
import { FxCitations, FxDualAI, FxFormats, FxLevels, FxOutput, FxVisual } from "./brief/Features";
import SearchDemo from "./filesearch/SearchDemo";
import SimilarityMap from "./filesearch/SimilarityMap";
import FileSearchSteps from "./filesearch/Steps";
import FileSearchDashboard from "./filesearch/Dashboard";
import { FxInstant, FxMatch, FxOcr, FxRepos, FxSecure, FxWeights } from "./filesearch/Features";
import BookingDemo from "./medibook/BookingDemo";
import SymptomMap from "./medibook/SymptomMap";
import MediSteps from "./medibook/Steps";
import MediDashboard from "./medibook/Dashboard";
import { FxAlwaysOn, FxBilingual, FxMatching, FxPrivacy, FxSymptoms, FxWhatsApp } from "./medibook/Features";

/** Product-specific live visuals for each section of a product's view, keyed by slug. */
export type ProductVisuals = {
  Hero?: ComponentType;
  Overview?: ComponentType;
  /** one per key feature, in order */
  features?: ComponentType[];
  Steps?: ComponentType<{ steps: { title: string; text: string }[] }>;
  Benefits?: ComponentType;
};

export const VISUALS: Record<string, ProductVisuals> = {
  cognaassist: {
    Hero: ChatDemo,
    Overview: Integrate,
    // listed one by one: a server component can only reference client components individually
    features: [FxIntegration, FxCrawl, FxRag, FxAlways, FxTenants, FxAnalytics],
    Steps,
    Benefits: Dashboard,
  },
  cognabrief: {
    Hero: BriefDemo,
    Overview: Condense,
    features: [FxFormats, FxLevels, FxDualAI, FxCitations, FxVisual, FxOutput],
    Steps: BriefSteps,
    Benefits: BriefDashboard,
  },
  cognafilesearch: {
    Hero: SearchDemo,
    Overview: SimilarityMap,
    features: [FxInstant, FxOcr, FxMatch, FxRepos, FxWeights, FxSecure],
    Steps: FileSearchSteps,
    Benefits: FileSearchDashboard,
  },
  "medibook-ai": {
    Hero: BookingDemo,
    Overview: SymptomMap,
    features: [FxSymptoms, FxBilingual, FxMatching, FxAlwaysOn, FxPrivacy, FxWhatsApp],
    Steps: MediSteps,
    Benefits: MediDashboard,
  },
};
