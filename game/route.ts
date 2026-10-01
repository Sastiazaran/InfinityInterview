import type { Bloodline, Role } from "./types";

export type NodeDef = {
  id: string;
  role: Role;
  name: string;
  place: string;
  line: string;
};

export const NODES: NodeDef[] = [
  {
    id: "foothills",
    role: "algo",
    name: "Foothill Sentinel",
    place: "The Foothills",
    line: "Arrays, hash maps, and the structures you reach for first.",
  },
  {
    id: "gate",
    role: "algo",
    name: "Gate Warden",
    place: "The Gate",
    line: "Stacks, queues, and a trace you can do by hand.",
  },
  {
    id: "yard",
    role: "system",
    name: "The Architect",
    place: "The Yard",
    line: "A tradeoff. The algorithm underneath is the real answer.",
  },
  {
    id: "stair",
    role: "craft",
    name: "The Refactorer",
    place: "The Stair",
    line: "Names, tests, and the cost of a mess you leave behind.",
  },
  {
    id: "west",
    role: "puzzle",
    name: "The Puzzlewright",
    place: "West Tower",
    line: "Run the algorithm. A lucky letter will not save you.",
  },
  {
    id: "east",
    role: "specialist",
    name: "East Tower",
    place: "East Tower",
    line: "",
  },
  {
    id: "throne",
    role: "boss",
    name: "The Crown Examiner",
    place: "The Throne",
    line: "A trace, a design tradeoff, and a bug in a few lines.",
  },
];

export function presentNode(node: NodeDef, bloodline: Bloodline): NodeDef {
  if (node.role !== "specialist") return node;
  if (bloodline === 1) {
    return {
      ...node,
      name: "Lady Latency",
      line: "First paint, page weight, and the boundary of a component.",
    };
  }
  if (bloodline === 2) {
    return {
      ...node,
      name: "The Shipwright",
      line: "Pipelines, probes, and the daily work of getting a change out.",
    };
  }
  return {
    ...node,
    name: "The Cartographer",
    line: "Where one word means two things, and what a model may claim.",
  };
}
