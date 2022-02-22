import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet } from './sprites';
import { global } from './global';

export class Enemy implements Sprite {
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationkey: string;
  moveSpeed: number;

  constructor(startPos: Vector){
    this.id = 'slime';
    this.clip = new Rect({ x: 0, y: 0, w: 16, h: 16 });
    this.view = new Rect({ x: 0, y: 0, w: 32, h: 32 });
    this.world = { x: startPos.x, y: startPos.y };
    this.velocity = { x: 1, y: 0 };
    this.animationkey = 'idleSouth';
    this.moveSpeed = 1;
    
    // @TODO: Check requested startPos to see it fits in world. Use rect_contains function
    
  }

  update(){

  }
}

export function spawnEnemy(archetype: string, startPos: Vector): Enemy
{
  // Check start pos against world bounds

  // Get sheet, stats etc. from archetype map



  const enemy = new Enemy(startPos);
  return enemy;
}
