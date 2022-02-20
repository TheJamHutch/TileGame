import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet } from './sprites';

export class Player implements Sprite {
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationkey: string;
  moveSpeed: number;

  constructor(spawnPos: Vector, spriteSize: Vector){
    this.id = 'player';
    this.clip = { x: 0, y: 0, w: spriteSize.x, h: spriteSize.y };
    this.view = { x: spawnPos.x, y: spawnPos.y, w: spriteSize.x, h: spriteSize.y };
    this.world = { x: spawnPos.x, y: spawnPos.y };
    this.velocity = { x: 0, y: 0 };
    this.moveSpeed = 2;

    this.animationkey = 'idleSouth';
  }

  update(camera: Camera, worldBounds: Vector, tilesInView: Tile[]): void {

    // Check world bounds
    if (this.velocity.x < 0 && this.world.x <= 0){
      this.velocity.x = 0;
    } else if (this.velocity.x > 0 && (this.world.x > worldBounds.x)){
      this.velocity.x = 0;
    }
    if (this.velocity.y < 0 && this.world.y <= 0){
      this.velocity.y = 0;
    } else if (this.velocity.y > 0 && (this.world.y + this.view.h > worldBounds.y)){
      this.velocity.y = 0;
    }
  
    this.world.x += this.velocity.x * this.moveSpeed;
    this.world.y += this.velocity.y * this.moveSpeed;
  
    if (camera.locked.west || camera.locked.east){
      this.view.x += this.velocity.x * this.moveSpeed;
    }
    if (camera.locked.north || camera.locked.south){
      this.view.y += this.velocity.y * this.moveSpeed;
    }
  }

}
