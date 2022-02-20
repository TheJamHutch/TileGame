import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet } from './sprites';

export class Enemy implements Sprite{
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationkey: string;
  moveSpeed: number;

  constructor(){
    this.id = 'slime';
    this.clip = { x: 0, y: 0, w: 16, h: 16 };
    this.view = { x: 100, y: 100, w: 32, h: 32 };
    this.world = { x: 100, y: 100 };
    this.velocity = { x: 0, y: 0 };
    this.animationkey = '';
    this.moveSpeed = 2;
  }

  update(){
    this.view.x = this.world.x;
    this.view.y = this.world.y;
  }
}
