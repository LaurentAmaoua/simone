"use client";

import { MapPinnedIcon } from "lucide-react";
import { useState } from "react";
import {
  Select as SelectContainer,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import styles from "./_styles/Select.module.css";

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

type SelectProps = {
  onSelect: (site: CAMPSITES) => void;
};

export const Select = ({ onSelect }: SelectProps) => {
  const handleValueChange = (value: string) => {
    onSelect(value as CAMPSITES);
  };
  return (
    <SelectContainer onValueChange={handleValueChange}>
      <SelectTrigger className={styles.trigger}>
        <MapPinnedIcon className={styles.mapIcon} />
        <SelectValue placeholder="Choisir un site" />
      </SelectTrigger>
      <SelectContent className={styles.contentContainer}>
        {Object.keys(RegionToCampsiteMapping).map((region) => (
          <SelectGroup key={region}>
            <SelectLabel>{region}</SelectLabel>
            {Object.values(RegionToCampsiteMapping[region as Region]).map(
              (site) => (
                <SelectItem key={site} value={site} className={styles.item}>
                  {site}
                </SelectItem>
              ),
            )}
          </SelectGroup>
        ))}
      </SelectContent>
    </SelectContainer>
  );
};
