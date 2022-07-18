import * as _ from 'lodash';
import { Vector, Rect } from './primitives';

export interface Sprite{
  clip: Rect;
  view: Rect;
};

// Returns the position and size of the clipping rectangle of a spritesheet at a particular index.
export function setClip(index: number, cellSize: number, sheetDims: Vector): Rect {
  let x = 0;
  let y = 0;
  let c = 0;

  while (c < index){
    x += 1;
    if (x >= sheetDims.x){
      x = 0;
      y++;

      if (y >= sheetDims.y){
        x = 0;
        y = 0;
      }
    }

    c++;
  }

  return new Rect({
    x: x * cellSize,
    y: y * cellSize, 
    w: cellSize, 
    h: cellSize
  });
}

export function animateSprite(sprite: Sprite, currAnim: any, frameCount: number): void {
  let animIdx = Math.floor((frameCount / currAnim.speed) % currAnim.frames.length);
  sprite.clip.x = (currAnim.frames[animIdx].x * sprite.clip.w);
  sprite.clip.y = (currAnim.frames[animIdx].y * sprite.clip.h);
}
