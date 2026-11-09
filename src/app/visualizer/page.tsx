import type { Metadata } from "next";

import { DsaVisualizer } from "@/components/dsa-visualizer";

export const metadata: Metadata = {
  title: "Visualizer",
  alternates: { canonical: "/visualizer" },
  description:
    "Trace any algorithm step by step: paste JavaScript, TypeScript, or Python, add JSON input, and watch arrays, pointers, maps, graphs, and recursion unfold.",
};

export default function VisualizerPage() {
  return <DsaVisualizer />;
}
