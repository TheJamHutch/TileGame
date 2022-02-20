import { Events } from "./events"

export type Global = {
  eventsRef: any | null,
  frameCount: number
};
export const global = {
  eventsRef: null as any,
  frameCount: 0
};