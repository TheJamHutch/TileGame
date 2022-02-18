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

    /*
    this.view.x = this.worldToView(this.world, camera).x;
    this.view.y = this.worldToView(this.world, camera).y;*/
  
    if (camera.locked.west || camera.locked.east){
      this.view.x += this.velocity.x * this.moveSpeed;
    }
    if (camera.locked.north || camera.locked.south){
      this.view.y += this.velocity.y * this.moveSpeed;
    }
  }

  private worldToView(world: Vector, camera: Camera): Vector {
    let view = {} as any;


    if (camera.locked.west){
      view.x = world.x - (camera.world.x % 320);
    } else {
      view.x = 320;
    }

    view.y = world.y - (camera.world.y % 240);
    /*
    const diff = this.view.x - Math.floor(camera.world.x % (camera.view.x / 2));
    view.x = (world.x - diff);
    const diff2 = this.view.y - Math.floor(camera.world.y % (camera.view.y / 2));
    view.y = (world.y - diff2);*/

    return view;
  }

}
