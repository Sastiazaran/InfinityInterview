import { enemyAt, NODE_IDS, type EnemyId, type NodeId } from "./contracts";
import type { Role } from "./types";

export type NodeDef = {
  id: NodeId;
  role: Role;
  /** A short label for the place on the route. */
  place: string;
};

const ROLES: Record<NodeId, Role> = {
  foothills: "algo",
  gate: "algo",
  yard: "system",
  stair: "craft",
  west: "puzzle",
  east: "specialist",
  throne: "boss",
};

const PLACES: Record<NodeId, string> = {
  foothills: "The Shore",
  gate: "The Gate",
  yard: "The Yard",
  stair: "The Stair",
  west: "West Tower",
  east: "East Tower",
  throne: "The Throne",
};

export const NODES: NodeDef[] = NODE_IDS.map((id) => ({ id, role: ROLES[id], place: PLACES[id] }));

export const ROUTE_LENGTH = NODES.length;

export function nodeAt(index: number): NodeDef {
  return NODES[Math.max(0, Math.min(NODES.length - 1, index))];
}

export function enemyOf(index: number, bloodline: number): EnemyId {
  return enemyAt(nodeAt(index).id, bloodline);
}

/** East tower content follows its rotating specialist, not the difficulty tier. */
export function specialistTier(bloodline: number): 1 | 2 | 3 {
  const n = Math.max(1, Math.floor(bloodline));
  return (((n - 1) % 3) + 1) as 1 | 2 | 3;
}
