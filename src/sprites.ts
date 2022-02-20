import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { global } from './global';
import { Bitmap } from './render';

export interface Sprite{
  animationkey: string;
  clip: Rect;
  view: Rect;
};

export class SpriteSheet{
  id: string;
  dimensions: Vector;
  clipSize: Vector;
  scaleFactor: number;
  animations: any;

  constructor(sheetJson: any){
    this.id = sheetJson.name;
    this.dimensions = sheetJson.dimensions;
    this.clipSize = sheetJson.clipSize;
    this.scaleFactor = sheetJson.scaleFactor;
    this.animations = sheetJson.animations;
  }
}

export function animateSprite(sprite: Sprite, sheet: SpriteSheet): void {
  let currAnim = sheet.animations[sprite.animationkey];
  let animIdx = Math.floor((global.frameCount / currAnim.speed) % currAnim.frames.length);
  
  sprite.clip.x = currAnim.frames[animIdx].x;
  sprite.clip.y = currAnim.frames[animIdx].y;
}
