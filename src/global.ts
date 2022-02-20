import { Events } from "./events"
import { Vector } from "./primitives";

export type Global = {
  eventsRef: any | null,
  frameCount: number,
  worldBounds: Vector // Used for entities to know how big the world/ map is.
};
export const global = {
  eventsRef: null as any,
  frameCount: 0,
  worldBounds: { x: 0, y: 0 }
};