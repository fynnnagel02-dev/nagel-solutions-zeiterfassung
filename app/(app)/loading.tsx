import { PageHeader } from "@/src/components/shared/PageHeader";
import { Panel } from "@/src/components/shared/Panel";
import { SkeletonBlock } from "@/src/components/shared/SkeletonBlock";

export default function AppLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lädt"
        title="Arbeitsbereich wird vorbereitet"
        description="Die serverseitigen Daten und Freigaben werden geladen."
      />
      <Panel className="space-y-4">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-32 w-full" />
      </Panel>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-40 rounded-[1.75rem]" />
        <SkeletonBlock className="h-40 rounded-[1.75rem]" />
        <SkeletonBlock className="h-40 rounded-[1.75rem]" />
      </div>
    </div>
  );
}
