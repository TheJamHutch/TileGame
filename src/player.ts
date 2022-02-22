import { Tilemap, Tile } from './tilemap';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet } from './sprites';
import { global } from './global';

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
    this.clip = new Rect({ x: 0, y: 0, w: spriteSize.x, h: spriteSize.y });
    this.view = new Rect({ x: spawnPos.x, y: spawnPos.y, w: spriteSize.x, h: spriteSize.y });
    this.world = { x: spawnPos.x, y: spawnPos.y };
    this.velocity = { x: 0, y: 0 };
    this.moveSpeed = 2;

    this.animationkey = 'idleSouth';
  }

  update(collisionBoxes: Rect[]): void {

    // Check world bounds
    if (this.velocity.x < 0 && this.world.x <= 0){
      this.velocity.x = 0;
    } else if (this.velocity.x > 0 && ((this.world.x + this.view.w) > global.worldBounds.x)){
      this.velocity.x = 0;
    }
    if (this.velocity.y < 0 && this.world.y <= 0){
      this.velocity.y = 0;
    } else if (this.velocity.y > 0 && (this.world.y + this.view.h > global.worldBounds.y)){
      this.velocity.y = 0;
    }
    
    // Check collision
    for (let box of collisionBoxes) {
      const worldRect = new Rect({ x: this.world.x, y: this.world.y, w: this.view.w, h: this.view.h});

      let collideDir = this.checkCollision(worldRect, box);

      if (this.velocity.x > 0 && collideDir === 'east'){
        this.velocity.x = 0;
      } else if (this.velocity.x < 0 && collideDir === 'west'){
        this.velocity.x = 0;
      }
      if (this.velocity.y > 0 && collideDir === 'north'){
        this.velocity.y = 0;
      } else if (this.velocity.y < 0 && collideDir === 'south'){
        this.velocity.y = 0;
      }
    }
    

    this.world.x += this.velocity.x * this.moveSpeed;
    this.world.y += this.velocity.y * this.moveSpeed;
  }

  // @TODO: Refactor and comment
  private checkCollision(a: Rect, b: Rect): string {
    const collision = ((a.right > b.left && a.left < b.right) && (a.top < b.bottom && a.bottom > b.top));
    let collideDir = 'none';

    if (collision){
      collideDir =  (a.left - b.right > 0 && a.right - b.left < 0) ? 'east' :
                    (a.left - b.right > 0 && a.right - b.left < 0) ? 'west' : 'none';
               
      let xc = a.left - b.left;
      let yc = a.top - b.top;

      if (Math.abs(xc) > Math.abs(yc)){
        if (xc < 0){
          collideDir = 'east';
        } else if (xc > 0){
          collideDir = 'west';
        }
      } else {
        if (yc < 0){
          collideDir = 'north';
        } else if (yc > 0){
          collideDir = 'south';
        }
      }
    }
    
    return collideDir;
  }

}
