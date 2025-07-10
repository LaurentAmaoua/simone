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

import styles from "./styles/Select.module.css";

// DO NOT EDIT APOSTROPHES INTO SINGLE QUOTES
export enum CAMPSITES {
  BELA_BASQUE = "Bela Basque",
  CAP_DE_BRÉHAT = "Cap de Bréhat",
  DOMAINE_DE_BRÉHADOUR = "Domaine de Bréhadour",
  L_OCÉAN_ET_SPA = "L’Océan &amp; spa",
  LES_TRUFFIERES_DE_DORDOGNE = "Les Truffières de Dordogne",
  LA_POINTE_DE_SAINT_GILDAS = "La Pointe Saint-Gildas",
  LE_CARAVAN_ÎLE = "Le Caravan'île",
  LE_SUROIT = "Le Suroit",
  L_ÉTOILE_DE_MER = "L’Étoile de Mer",
  MANOIR_DE_KER_AN_POUL = "Manoir de Ker An Poul",
  PALMYRE_LOISIRS = "Palmyre Loisirs",
}

export enum Region {
  NOUVELLE_AQUITAINE = "Nouvelle-Aquitaine",
  BRETAGNE = "Bretagne",
  PAYS_DE_LA_LOIRE = "Pays de la Loire",
  OCCITANIE = "Occitanie",
}

const RegionToCampsiteMapping: Record<Region, CAMPSITES[]> = {
  [Region.NOUVELLE_AQUITAINE]: [
    CAMPSITES.BELA_BASQUE, // Anglet, Pyrénées-Atlantiques
    CAMPSITES.LES_TRUFFIERES_DE_DORDOGNE, // Saint-Geniès, Dordogne
    CAMPSITES.LE_SUROIT, // Saint-Georges-d'Oléron, Charente-Maritime
    CAMPSITES.L_OCÉAN_ET_SPA, // Île de Ré, Charente-Maritime
    CAMPSITES.PALMYRE_LOISIRS, // Les Mathes, Charente-Maritime
  ],
  [Region.BRETAGNE]: [
    CAMPSITES.CAP_DE_BRÉHAT, // Plouézec, Côtes-d'Armor
    CAMPSITES.MANOIR_DE_KER_AN_POUL, // Sarzeau, Morbihan
  ],
  [Region.PAYS_DE_LA_LOIRE]: [
    CAMPSITES.DOMAINE_DE_BRÉHADOUR, // Guérande, Loire-Atlantique
    CAMPSITES.LA_POINTE_DE_SAINT_GILDAS, // Préfailles, Loire-Atlantique
    CAMPSITES.LE_CARAVAN_ÎLE, // La Guérinière, Vendée
  ],
  [Region.OCCITANIE]: [
    CAMPSITES.L_ÉTOILE_DE_MER, // Sérignan, Hérault
  ],
} as const;

const stringToCampsite = (campsite: string): CAMPSITES => {
  const entry = Object.entries(CAMPSITES).find(
    ([_, value]) => String(value) === campsite,
  );

  if (!entry) {
    throw new Error(`Invalid campsite value: ${campsite}`);
  }

  return entry[1] as CAMPSITES;
};

const keyToCampsite = (key: string): CAMPSITES | null => {
  if (key in CAMPSITES) {
    return CAMPSITES[key as keyof typeof CAMPSITES];
  }
  return null;
};

const decodeHtmlEntities = (text: string): string => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
};

type SelectProps = {
  onSelect: (site: CAMPSITES) => void;
};

export const Select = ({ onSelect }: SelectProps) => {
  const searchParams = useSearchParams();
  const siteParam = searchParams.get("site");

  const defaultSite = siteParam ? keyToCampsite(siteParam) : null;

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
        )?.[0] as Region) || Region.NOUVELLE_AQUITAINE;

      groupedCampsites[region].push(campsite);
    });

    setCampsitesByRegion(groupedCampsites);

    if (defaultSite) {
      onSelect(defaultSite);
    }
  }, [siteParam, defaultSite, onSelect]);

  const handleValueChange = (value: string) => {
    onSelect(stringToCampsite(value));
  };

  return (
    <SelectContainer
      defaultValue={defaultSite ?? ""}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className={styles.trigger}>
        <MapPinnedIcon className={styles.mapIcon} />
        <SelectValue placeholder="Votre site" />
      </SelectTrigger>
      <SelectContent className={styles.contentContainer}>
        {Object.keys(campsitesByRegion).map(
          (region) =>
            campsitesByRegion[region as Region].length > 0 && (
              <SelectGroup key={region}>
                <SelectLabel>{region}</SelectLabel>
                {campsitesByRegion[region as Region].map((site) => (
                  <SelectItem key={site} value={site} className={styles.item}>
                    {decodeHtmlEntities(site)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ),
        )}
      </SelectContent>
    </SelectContainer>
  );
};
