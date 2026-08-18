import { SkeletonStack } from "@/components/ui/Skeleton";

export default function Loading() {
  return <SkeletonStack heights={["h-16", "h-64", "h-24", "h-32"]} />;
}
