import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet } from './sprites';

export interface Entity{
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
}