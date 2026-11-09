import { DEMOS } from "@/components/demo-data";
import { DemoVideo } from "@/components/demo-video";

export function DemoSection({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">See it in action</p>
        <h2 className="mt-3 text-3xl font-medium tracking-normal sm:text-4xl">
          A trace, one step at a time.
        </h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Five live demos, one per family — sorting, searching, trees, hashing, and recursion.
          Each one plays the real visualizer: bubble sort swaps values into place, binary search
          narrows its window, Invert Binary Tree mirrors a tree, Two Sum builds a hash map, and
          fibonacci grows and unwinds its recursive call stack.
        </p>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {DEMOS.map((demo) => (
          <DemoVideo key={demo.id} demo={demo} />
        ))}
      </div>
    </div>
  );
}
