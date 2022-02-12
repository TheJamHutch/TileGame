import { Render } from './render';
import { Vector, Rect } from './primitives';
import * as _ from 'lodash';

export type SpriteAnimation = {
  frameIndex: number
  nFrames: number;
    
}
  
export type SpriteSheet = {
  texture: Render.Bitmap;
  animations: any;
}
  
export function createSpritesheet(texture: Render.Bitmap, rawSheet: any): SpriteSheet{
  let sheet = {} as any;
  
  sheet.texture = texture;
  sheet.animations = _.cloneDeep(rawSheet.animations);
 
  return sheet;
}
  
export function animateSprite(clip: Rect, animation: SpriteAnimation, frameCount: number): void {
  
}
