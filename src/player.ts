import { Tilemap, Tile } from './tilemap';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet } from './sprites';
import { global } from './global';

enum MoveDirection
{
  Stop = 0,
  North,
  East,
  South,
  West
};

enum CollisionDirection
{
  None = 0,
  North,
  East,
  South,
  West
};

function directionToVelocity(direction: MoveDirection | CollisionDirection): Vector
{
  let vel = { x: 0, y: 0 };

  switch(direction)
  {
    case 0:
      break
    case 1:
      vel.y = -1;
      break;
    case 2:
      vel.x = 1;
      break;
    case 3:
      vel.y = 1;
      break;
    case 4:
      vel.x = 1;
      break;
  }

  return {
    x: vel.x,
    y: vel.y
  };
}

function directionFromVelocity(vel: Vector): MoveDirection | CollisionDirection
{
  return MoveDirection.Stop;
}

export class Player implements Sprite {
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationkey: string;
  moveSpeed: number;
  attacking: boolean;

  constructor(spawnPos: Vector, spriteSize: Vector){
    this.id = 'player';
    this.clip = new Rect({ x: 0, y: 0, w: spriteSize.x, h: spriteSize.y });
    this.view = new Rect({ x: spawnPos.x, y: spawnPos.y, w: spriteSize.x, h: spriteSize.y });
    this.world = { x: spawnPos.x, y: spawnPos.y };
    this.velocity = { x: 0, y: 0 };
    this.moveSpeed = 2;

    this.attacking = false;

    this.animationkey = 'idleSouth';
    
  }

  update(collisionBoxes: Rect[]): void {
    if (this.attacking){
      this.animationkey = 'attack';
      if (global.frameCount % 100 === 1){
        this.attacking = false;
        this.animationkey = 'idleSouth';
      }
    }

    // @TODO: Refactor into move function?
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

      if (this.velocity.x > 0 && collideDir === CollisionDirection.East){
        this.velocity.x = 0;
      } else if (this.velocity.x < 0 && collideDir === CollisionDirection.West){
        this.velocity.x = 0;
      }
      if (this.velocity.y > 0 && collideDir === CollisionDirection.North){
        this.velocity.y = 0;
      } else if (this.velocity.y < 0 && collideDir === CollisionDirection.South){
        this.velocity.y = 0;
      }
    }
    

    this.world.x += this.velocity.x * this.moveSpeed;
    this.world.y += this.velocity.y * this.moveSpeed;
  }

  // @TODO: Refactor and comment
  private checkCollision(a: Rect, b: Rect): CollisionDirection {
    const collision = ((a.right > b.left && a.left < b.right) && (a.top < b.bottom && a.bottom > b.top));
    let collideDir = CollisionDirection.None;

    if (collision){
      collideDir =  (a.left - b.right > 0 && a.right - b.left < 0) ? CollisionDirection.East :
                    (a.left - b.right > 0 && a.right - b.left < 0) ? CollisionDirection.West : CollisionDirection.None;
               
      let xc = a.left - b.left;
      let yc = a.top - b.top;

      if (Math.abs(xc) > Math.abs(yc)){
        if (xc < 0){
          collideDir = CollisionDirection.East;
        } else if (xc > 0){
          collideDir = CollisionDirection.West;
        }
      } else {
        if (yc < 0){
          collideDir = CollisionDirection.North;
        } else if (yc > 0){
          collideDir = CollisionDirection.South;
        }
      }
    }
    
    return collideDir;
  }

}
