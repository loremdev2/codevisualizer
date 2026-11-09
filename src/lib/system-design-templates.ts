import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

// ---------------------------------------------------------------------------
// System-design building blocks
//
// Each entry is a single component you can drop on the canvas: one box, icon
// or container. They share a colour language so a sketch reads at a glance —
// blue = compute, green = persistent data, orange = async / buffering,
// violet = edge & network, cyan = background processing, grey = neutral.
//
// Composite blocks (the user icon, the database cylinder, the boundary box)
// carry a placeholder groupId so the pieces move as one; the insert handler
// stamps a fresh id per insert so two copies stay independently selectable.
// ---------------------------------------------------------------------------

export type SystemDesignInsert = {
  id: string;
  label: string;
  description: string;
  elements: ExcalidrawElementSkeleton[];
};

// ---------------------------------------------------------------------------
// Palette (Excalidraw's own open-color fills)
// ---------------------------------------------------------------------------

type Paint = { fill: string; stroke: string };

const BLUE: Paint = { fill: "#a5d8ff", stroke: "#1971c2" };
const GREEN: Paint = { fill: "#b2f2bb", stroke: "#2f9e44" };
const ORANGE: Paint = { fill: "#ffd8a8", stroke: "#e8590c" };
const VIOLET: Paint = { fill: "#d0bfff", stroke: "#6741d9" };
const CYAN: Paint = { fill: "#99e9f2", stroke: "#0c8599" };
const GRAY: Paint = { fill: "#e9ecef", stroke: "#495057" };
const MUTED = "#868e96";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ShapeOptions = {
  paint?: Paint;
  text?: string;
  fontSize?: number;
  dashed?: boolean;
  rounded?: boolean;
  /** Placeholder group id — remapped to a unique id on insert. */
  group?: string;
};

function shape(
  type: "rectangle" | "ellipse" | "diamond",
  x: number,
  y: number,
  width: number,
  height: number,
  opts: ShapeOptions = {},
): ExcalidrawElementSkeleton {
  const { fill = "transparent", stroke = "#1e1e1e" } = opts.paint ?? {};
  return {
    type,
    x,
    y,
    width,
    height,
    strokeColor: stroke,
    backgroundColor: fill,
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: opts.dashed ? "dashed" : "solid",
    roughness: 1,
    opacity: 100,
    ...(opts.rounded && type === "rectangle" ? { roundness: { type: 3 } } : {}),
    ...(opts.group ? { groupIds: [opts.group] } : {}),
    ...(opts.text ? { label: { text: opts.text, fontSize: opts.fontSize ?? 16 } } : {}),
  };
}

function caption(
  x: number,
  y: number,
  text: string,
  opts: { fontSize?: number; color?: string; group?: string } = {},
): ExcalidrawElementSkeleton {
  return {
    type: "text",
    x,
    y,
    text,
    fontSize: opts.fontSize ?? 14,
    strokeColor: opts.color ?? MUTED,
    opacity: 100,
    ...(opts.group ? { groupIds: [opts.group] } : {}),
  };
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

/** Person icon: head + torso, labelled. */
function user(): ExcalidrawElementSkeleton[] {
  const group = "sd-user";
  const paint = GRAY;
  return [
    shape("ellipse", 11, 0, 34, 34, { paint, group }),
    shape("rectangle", 0, 42, 56, 46, { paint, rounded: true, group }),
    caption(12, 94, "User", { color: "#495057", group }),
  ];
}

/** Compute unit — stateless request handler. */
function service(): ExcalidrawElementSkeleton[] {
  return [
    shape("rectangle", 0, 0, 160, 72, {
      paint: BLUE,
      rounded: true,
      text: "Service",
    }),
  ];
}

/** Entry point for client traffic; spreads load across replicas. */
function loadBalancer(): ExcalidrawElementSkeleton[] {
  return [
    shape("diamond", 0, 0, 175, 110, {
      paint: VIOLET,
      text: "Load Balancer",
      fontSize: 15,
    }),
  ];
}

/** Single ingress: auth, rate limiting, routing. */
function apiGateway(): ExcalidrawElementSkeleton[] {
  return [
    shape("rectangle", 0, 0, 180, 72, {
      paint: VIOLET,
      rounded: true,
      text: "API Gateway",
    }),
  ];
}

/** Cylinder — rows in a primary store. */
function database(): ExcalidrawElementSkeleton[] {
  const group = "sd-db";
  const width = 150;
  const height = 92;
  return [
    // Body first so the two ellipse rims paint over its straight edges.
    shape("rectangle", 0, 18, width, height, {
      paint: GREEN,
      text: "Database",
      group,
    }),
    shape("ellipse", 0, 18 + height - 18, width, 36, { paint: GREEN, group }),
    shape("ellipse", 0, 0, width, 36, { paint: GREEN, group }),
  ];
}

/** Read-through cache in front of the database. */
function cache(): ExcalidrawElementSkeleton[] {
  return [
    shape("rectangle", 0, 0, 150, 72, {
      paint: ORANGE,
      rounded: true,
      text: "Cache",
    }),
  ];
}

/** Buffer between producers and consumers — dashed to read as async. */
function queue(): ExcalidrawElementSkeleton[] {
  return [
    shape("rectangle", 0, 0, 180, 72, {
      paint: ORANGE,
      rounded: true,
      dashed: true,
      text: "Message Queue",
      fontSize: 15,
    }),
  ];
}

/** Background consumer: jobs, fan-out, retries. */
function worker(): ExcalidrawElementSkeleton[] {
  return [
    shape("rectangle", 0, 0, 150, 72, {
      paint: CYAN,
      rounded: true,
      text: "Worker",
    }),
  ];
}

/** Cylinder — blobs, uploads, backups (S3-style). */
function objectStorage(): ExcalidrawElementSkeleton[] {
  const group = "sd-storage";
  const width = 150;
  const height = 80;
  return [
    shape("rectangle", 0, 18, width, height, {
      paint: GRAY,
      text: "Object Storage",
      fontSize: 14,
      group,
    }),
    shape("ellipse", 0, 18 + height - 18, width, 36, { paint: GRAY, group }),
    shape("ellipse", 0, 0, width, 36, { paint: GRAY, group }),
  ];
}

/** Edge cache — static assets and media served close to the user. */
function cdn(): ExcalidrawElementSkeleton[] {
  return [
    shape("ellipse", 0, 0, 150, 84, {
      paint: VIOLET,
      text: "CDN",
      fontSize: 15,
    }),
  ];
}

/** Name resolution — the first hop in almost every diagram. */
function dns(): ExcalidrawElementSkeleton[] {
  return [
    shape("ellipse", 0, 0, 120, 74, {
      paint: GRAY,
      text: "DNS",
      fontSize: 15,
    }),
  ];
}

/** Dashed container to enclose a VPC / region / trust boundary. */
function boundary(): ExcalidrawElementSkeleton[] {
  const group = "sd-boundary";
  return [
    shape("rectangle", 0, 0, 520, 320, {
      paint: { fill: "transparent", stroke: MUTED },
      dashed: true,
      rounded: true,
      group,
    }),
    caption(16, 10, "VPC / Region", { group }),
  ];
}

// ---------------------------------------------------------------------------
// Exported block list
// ---------------------------------------------------------------------------

export const SYSTEM_DESIGN_INSERTS: SystemDesignInsert[] = [
  {
    id: "sd-user",
    label: "User",
    description: "Person icon — client, actor, or end user",
    elements: user(),
  },
  {
    id: "sd-service",
    label: "Service",
    description: "Stateless compute — API or business logic",
    elements: service(),
  },
  {
    id: "sd-load-balancer",
    label: "Load balancer",
    description: "Spreads traffic across replicas",
    elements: loadBalancer(),
  },
  {
    id: "sd-api-gateway",
    label: "API gateway",
    description: "Single ingress — auth, throttling, routing",
    elements: apiGateway(),
  },
  {
    id: "sd-database",
    label: "Database",
    description: "Cylinder — primary relational or document store",
    elements: database(),
  },
  {
    id: "sd-cache",
    label: "Cache",
    description: "Read-through cache (Redis / Memcached)",
    elements: cache(),
  },
  {
    id: "sd-queue",
    label: "Message queue",
    description: "Async buffer — Kafka, SQS, RabbitMQ",
    elements: queue(),
  },
  {
    id: "sd-worker",
    label: "Worker",
    description: "Background consumer — jobs, fan-out, retries",
    elements: worker(),
  },
  {
    id: "sd-object-storage",
    label: "Object storage",
    description: "Blobs and uploads — S3-style bucket",
    elements: objectStorage(),
  },
  {
    id: "sd-cdn",
    label: "CDN",
    description: "Edge cache for static assets and media",
    elements: cdn(),
  },
  {
    id: "sd-dns",
    label: "DNS",
    description: "Name resolution — first hop of a request",
    elements: dns(),
  },
  {
    id: "sd-boundary",
    label: "Boundary",
    description: "Dashed container for a VPC, region, or trust zone",
    elements: boundary(),
  },
];
