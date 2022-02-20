import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet } from './sprites';
import { global } from './global';

export class Enemy implements Sprite {
  id: string;
  archetypeId: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationkey: string;
  moveSpeed: number;

  constructor(archetypeId: string, startPos: Vector){
    this.id = 'slime';
    this.archetypeId = archetypeId;
    this.clip = { x: 0, y: 0, w: 16, h: 16 };
    this.view = { x: 0, y: 0, w: 32, h: 32 };
    this.world = { x: startPos.x, y: startPos.y };
    this.velocity = { x: 1, y: 0 };
    this.animationkey = 'idleSouth';
    this.moveSpeed = 1;
  }

  update(){

  }
}
