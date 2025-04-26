"use client";

import { useSearchParams } from "next/navigation";
import { MapPinnedIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select as SelectContainer,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";

import styles from "./styles/Select.module.css";

// Define regions for grouping
enum Region {
  CHARENTE_MARITIME = "Charente-Maritime",
  COTES_D_ARMOR = "Côtes-d'Armor",
  DORDOGNE = "Dordogne",
  HERAULT = "Hérault",
  LOIRE_ATLANTIQUE = "Loire-Atlantique",
  MORBIHAN = "Morbihan",
  PYRENEES_ATLANTIQUES = "Pyrénées-Atlantiques",
}

// TODO - Missing 2 campsites
export enum CAMPSITES {
  PLOUEZEC = "Cap de Bréhat",
  SARZEAU = "Manoir de Ker an Poul",
  GUÉRANDE = "Domaine de Bréhadour",
  PRÉFAILLES = "La Pointe Saint-Gildas",
  ILE_DE_RÉ = "L'Océan & Spa",
  LA_PALMYRE = "Palmyre Loisirs",
  ANGLET = "Bela Basque",
  ST_GENIÈS = "Les Truffières de Dordogne",
  SÉRIGNAN_PLAGE = "L'Étoile de Mer",
}

const RegionToCampsiteMapping: Record<Region, CAMPSITES[]> = {
  "Charente-Maritime": [CAMPSITES.ILE_DE_RÉ, CAMPSITES.LA_PALMYRE],
  "Côtes-d'Armor": [CAMPSITES.PLOUEZEC],
  Dordogne: [CAMPSITES.ST_GENIÈS],
  Hérault: [CAMPSITES.SÉRIGNAN_PLAGE],
  "Loire-Atlantique": [CAMPSITES.GUÉRANDE, CAMPSITES.PRÉFAILLES],
  Morbihan: [CAMPSITES.SARZEAU],
  "Pyrénées-Atlantiques": [CAMPSITES.ANGLET],
} as const;

// Helper function to convert string to CAMPSITES enum
const stringToCampsite = (campsite: string): CAMPSITES => {
  // Find matching enum value by comparing strings
  const entry = Object.entries(CAMPSITES).find(
    ([_, value]) => String(value) === campsite,
  );

  if (!entry) {
    throw new Error(`Invalid campsite value: ${campsite}`);
  }

  return entry[1] as CAMPSITES;
};

type SelectProps = {
  onSelect: (site: CAMPSITES) => void;
};

export const Select = ({ onSelect }: SelectProps) => {
  const searchParams = useSearchParams();
  const defaultSelection = searchParams.get("site") ?? undefined;

  // Group campsites by region
  const [campsitesByRegion, setCampsitesByRegion] = useState<
    Record<Region, string[]>
  >({} as Record<Region, string[]>);

  useEffect(() => {
    const groupedCampsites: Record<Region, string[]> = {} as Record<
      Region,
      string[]
    >;

    // Initialize regions
    Object.values(Region).forEach((region) => {
      groupedCampsites[region] = [];
    });

    // Group campsites by region
    Object.values(CAMPSITES).forEach((campsite) => {
      // Find matching region for this campsite
      const region =
        (Object.entries(RegionToCampsiteMapping).find(([_, campsiteList]) =>
          campsiteList.some((c) => c === campsite),
        )?.[0] as Region) || Region.CHARENTE_MARITIME;

      groupedCampsites[region].push(campsite);
    });

    setCampsitesByRegion(groupedCampsites);

    // Only select from URL if explicitly provided
    if (
      defaultSelection &&
      Object.values(CAMPSITES).includes(defaultSelection as CAMPSITES)
    ) {
      // Convert string to CAMPSITES enum value safely
      onSelect(stringToCampsite(defaultSelection));
    }
  }, [defaultSelection, onSelect]);

  const handleValueChange = (value: string) => {
    // Convert string to CAMPSITES enum value safely
    onSelect(stringToCampsite(value));
  };

  return (
    <SelectContainer
      defaultValue={defaultSelection ?? ""}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className={styles.trigger}>
        <MapPinnedIcon className={styles.mapIcon} />
        <SelectValue placeholder="Choisir un site" />
      </SelectTrigger>
      <SelectContent className={styles.contentContainer}>
        {Object.keys(campsitesByRegion).map(
          (region) =>
            campsitesByRegion[region as Region].length > 0 && (
              <SelectGroup key={region}>
                <SelectLabel>{region}</SelectLabel>
                {campsitesByRegion[region as Region].map((site) => (
                  <SelectItem key={site} value={site} className={styles.item}>
                    {site}
                  </SelectItem>
                ))}
              </SelectGroup>
            ),
        )}
      </SelectContent>
    </SelectContainer>
  );
};
