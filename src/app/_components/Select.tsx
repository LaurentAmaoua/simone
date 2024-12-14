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

type SelectProps = {
  onSelect: (site: CAMPSITES) => void;
};

export const Select = ({ onSelect }: SelectProps) => {
  const [hasSelected, setHasSelected] = useState(false);

  const handleValueChange = (value: string) => {
    setHasSelected(true);
    onSelect(value as CAMPSITES);
  };
  return (
    <SelectContainer onValueChange={handleValueChange}>
      <SelectTrigger
        className={`${styles.trigger} ${hasSelected ? styles.selected : ""}`}
      >
        <MapPinnedIcon className={styles.mapIcon} />
        <SelectValue placeholder="Choisir un site" />
      </SelectTrigger>
      <SelectContent className={styles.contentContainer}>
        <SelectGroup>
          <SelectLabel>Sites Eden Villages</SelectLabel>
          {Object.values(CAMPSITES).map((location) => (
            <SelectItem key={location} value={location} className={styles.item}>
              {location}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </SelectContainer>
  );
};
