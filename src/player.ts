import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { SpriteAnimation, SpriteSheet } from './sprites';

export class Player {
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  moveSpeed: number;

  constructor(spawnPos: Vector, spriteSize: Vector){
    this.id = 'player0';
    this.clip = { x: 0, y: 0, w: spriteSize.x, h: spriteSize.y };
    this.view = { x: spawnPos.x, y: spawnPos.y, w: spriteSize.x, h: spriteSize.y };
    this.world = { x: spawnPos.x, y: spawnPos.y };
    this.velocity = { x: 0, y: 0 };
    this.moveSpeed = 2;
  }

  update(camera: Camera, worldBounds: Vector, tilesInView: Tile[]): void {
    
    /*
    // Unlock camera
    if (camera.locked.west && (this.world.x + 16 > 224)){
      camera.locked.west = false;
    }
    else if (camera.locked.east && (this.world.x + 46 < worldBounds.x - 224)){
      camera.locked.east = false;
    }
    if (camera.locked.north && (this.world.y > 164)){
      camera.locked.north = false;
    }
    else if (camera.locked.south && (this.world.y + 46 < worldBounds.y - 164)){
      camera.locked.south = false;
    }
  
    // Check world bounds
    if (this.velocity.x < 0 && this.world.x <= 0){
      this.velocity.x = 0;
    } else if (this.velocity.x > 0 && (this.world.x + this.view.w > worldBounds.x)){
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
    }*/
  }

}
