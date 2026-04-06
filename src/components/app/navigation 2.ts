import type { AppRole } from "@/src/lib/types/domain";
import { buildAppHref } from "@/src/lib/demo/paths";

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

type NavigationRuntime = {
  isDemo: boolean;
  role: AppRole;
  embed: boolean;
  basePath: string;
};

function withRuntime(href: string, runtime: NavigationRuntime) {
  return buildAppHref(href, runtime);
}

export function getNavigationForRole(role: AppRole, runtime?: NavigationRuntime): NavigationModel {
  const currentRuntime = runtime ?? { isDemo: false, role, embed: false, basePath: "" };

  if (role === "employee") {
    return {
      primary: [
        { href: withRuntime("/heute", currentRuntime), label: "Heute" },
        { href: withRuntime("/woche", currentRuntime), label: "Woche" },
        { href: withRuntime("/abwesenheiten", currentRuntime), label: "Abwesenheiten" },
        { href: withRuntime("/korrekturen", currentRuntime), label: "Korrekturen" },
      ],
      sections: [],
    };
  }

  if (role === "team_lead") {
    return {
      primary: [
        {
          href: withRuntime("/team/heute", currentRuntime),
          label: "Team heute",
          matchPrefix: withRuntime("/team/heute", currentRuntime),
        },
        {
          href: withRuntime("/team/freigaben", currentRuntime),
          label: "Freigaben",
          matchPrefix: withRuntime("/team/freigaben", currentRuntime),
        },
        {
          href: withRuntime("/team/kalender", currentRuntime),
          label: "Kalender",
          matchPrefix: withRuntime("/team/kalender", currentRuntime),
        },
      ],
      sections: [],
    };
  }

  return {
    primary: [
      {
        href: withRuntime("/verwaltung/uebersicht", currentRuntime),
        label: "Übersicht",
        matchPrefix: withRuntime("/verwaltung/uebersicht", currentRuntime),
      },
    ],
    sections: [
      {
        title: "Stammdaten",
        items: [
          {
            href: withRuntime("/verwaltung/stammdaten/mitarbeitende", currentRuntime),
            label: "Mitarbeitende",
            matchPrefix: withRuntime("/verwaltung/stammdaten/mitarbeitende", currentRuntime),
          },
          {
            href: withRuntime("/verwaltung/stammdaten/teams", currentRuntime),
            label: "Teams",
            matchPrefix: withRuntime("/verwaltung/stammdaten/teams", currentRuntime),
          },
          {
            href: withRuntime("/verwaltung/stammdaten/projekte", currentRuntime),
            label: "Projekte",
            matchPrefix: withRuntime("/verwaltung/stammdaten/projekte", currentRuntime),
          },
          {
            href: withRuntime("/verwaltung/stammdaten/feiertage", currentRuntime),
            label: "Feiertage",
            matchPrefix: withRuntime("/verwaltung/stammdaten/feiertage", currentRuntime),
          },
          {
            href: withRuntime("/verwaltung/einstellungen", currentRuntime),
            label: "Einstellungen",
            matchPrefix: withRuntime("/verwaltung/einstellungen", currentRuntime),
          },
        ],
      },
      {
        title: "Steuerung",
        items: [
          {
            href: withRuntime("/verwaltung/steuerung/freigaben", currentRuntime),
            label: "Freigaben",
            matchPrefix: withRuntime("/verwaltung/steuerung/freigaben", currentRuntime),
          },
          {
            href: withRuntime("/verwaltung/steuerung/kalender", currentRuntime),
            label: "Kalender",
            matchPrefix: withRuntime("/verwaltung/steuerung/kalender", currentRuntime),
          },
          {
            href: withRuntime("/verwaltung/steuerung/auswertungen", currentRuntime),
            label: "Auswertungen",
            matchPrefix: withRuntime("/verwaltung/steuerung/auswertungen", currentRuntime),
          },
          {
            href: withRuntime("/verwaltung/steuerung/exporte", currentRuntime),
            label: "Exporte",
            matchPrefix: withRuntime("/verwaltung/steuerung/exporte", currentRuntime),
          },
        ],
      },
    ],
  };
}
