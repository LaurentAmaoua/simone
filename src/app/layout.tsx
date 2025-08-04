import "~/styles/globals.css";

import { HydrateClient } from "~/trpc/server";
import { type ReactNode } from "react";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

import localFont from "next/font/local";

import styles from "./styles/RootLayout.module.css";

const CorporativeAlt = localFont({
  src: "../../public/corporativealt-regular-webfont.woff2",
  variable: "--ff-CorporativeAlt",
});

const Rubik = localFont({
  src: "../../public/Rubik-VariableFont_wght.ttf",
  variable: "--ff-Rubik",
});

export const metadata: Metadata = {
  title: "Simone - Votre guide de vacances",
  description: "Découvrez les activités proposées aux campings d'Eden Villages",
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
    { rel: "icon", url: "/favicon.ico" }, // Fallback for older browsers
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <TRPCReactProvider>
      <HydrateClient>
        <html
          lang="en"
          className={`${CorporativeAlt.variable} ${Rubik.variable} ${styles.container}`}
        >
          <body className={styles.body}>{children}</body>
        </html>
      </HydrateClient>
    </TRPCReactProvider>
  );
}
