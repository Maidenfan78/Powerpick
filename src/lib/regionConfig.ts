import { Region } from "../stores/useRegionStore";
import comingSoonUSA from "../../assets/coming_soon_usa.png";
import comingSoonEU from "../../assets/coming_soon_eur.png";

export const REGION_LABELS: Record<Region, string> = {
  AU: "Australia",
  US: "USA",
  EU: "Europe",
};

export const REGION_PLACEHOLDER_IMAGES: Partial<Record<Region, number>> = {
  US: comingSoonUSA,
  EU: comingSoonEU,
};
