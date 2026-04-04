import type { AppRole } from "@/src/lib/types/domain";

export type NavItem = {
  href: string;
  label: string;
  matchPrefix?: string;
};

type NavigationSection = {
  title: string;
  items: NavItem[];
};

type NavigationModel = {
  primary: NavItem[];
  sections: NavigationSection[];
};

export function getNavigationForRole(role: AppRole): NavigationModel {
  if (role === "employee") {
    return {
      primary: [
        { href: "/heute", label: "Heute" },
        { href: "/woche", label: "Woche" },
        { href: "/abwesenheiten", label: "Abwesenheiten" },
        { href: "/korrekturen", label: "Korrekturen" },
      ],
      sections: [],
    };
  }

  if (role === "team_lead") {
    return {
      primary: [
        { href: "/team/heute", label: "Team heute", matchPrefix: "/team/heute" },
        { href: "/team/freigaben", label: "Freigaben", matchPrefix: "/team/freigaben" },
        { href: "/team/kalender", label: "Kalender", matchPrefix: "/team/kalender" },
      ],
      sections: [],
    };
  }

  return {
    primary: [{ href: "/verwaltung/uebersicht", label: "Übersicht", matchPrefix: "/verwaltung/uebersicht" }],
    sections: [
      {
        title: "Stammdaten",
        items: [
          { href: "/verwaltung/stammdaten/mitarbeitende", label: "Mitarbeitende", matchPrefix: "/verwaltung/stammdaten/mitarbeitende" },
          { href: "/verwaltung/stammdaten/teams", label: "Teams", matchPrefix: "/verwaltung/stammdaten/teams" },
          { href: "/verwaltung/stammdaten/projekte", label: "Projekte", matchPrefix: "/verwaltung/stammdaten/projekte" },
          { href: "/verwaltung/stammdaten/feiertage", label: "Feiertage", matchPrefix: "/verwaltung/stammdaten/feiertage" },
          { href: "/verwaltung/einstellungen", label: "Einstellungen", matchPrefix: "/verwaltung/einstellungen" },
        ],
      },
      {
        title: "Steuerung",
        items: [
          { href: "/verwaltung/steuerung/freigaben", label: "Freigaben", matchPrefix: "/verwaltung/steuerung/freigaben" },
          { href: "/verwaltung/steuerung/kalender", label: "Kalender", matchPrefix: "/verwaltung/steuerung/kalender" },
          { href: "/verwaltung/steuerung/auswertungen", label: "Auswertungen", matchPrefix: "/verwaltung/steuerung/auswertungen" },
          { href: "/verwaltung/steuerung/exporte", label: "Exporte", matchPrefix: "/verwaltung/steuerung/exporte" },
        ],
      },
    ],
  };
}
