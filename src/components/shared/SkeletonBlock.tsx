import { cn } from "@/src/lib/presentation/cn";

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(226,232,240,0.75),rgba(241,245,249,0.95),rgba(226,232,240,0.75))] bg-[length:200%_100%]",
        className
      )}
    />
  );
}
