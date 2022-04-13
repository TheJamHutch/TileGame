import { Assets } from './assets';
import { Camera, worldToView } from './camera';
import { Rect, Vector } from './primitives';
import { Rendering } from './rendering';
import { Sprite, animateSprite } from './sprites';
import { Tiling } from './tilemap';

export namespace Entities{
  export enum MoveDirection {
    Stop = 0,
    North,
    East,
    South,
    West
  };

  export enum CollisionDirection {
    None = 0,
    North,
    East,
    South,
    West
  };

  export interface Entity{
    id: string;
    archetypeId: string;
    world: Vector;
    velocity: Vector;
  }

  export class Player implements Entity {
    id: string;
    archetypeId: string;
    clip: Rect;
    view: Rect;
    world: Vector;
    velocity: Vector;
    animationId: string;
    moveSpeed: number;
    indoors: boolean;
    moveDirection: MoveDirection;
    faceDirection: MoveDirection;

    prevAnimationId: string;
    attacking: boolean;
    // Local frame count for actions such as attacking, WTF TO DO WITH THIS?
    frameCount: number;

    attackBox: Rect;

    constructor(camera: Camera, playerMap: any, playerSheet: Assets.Spritesheet){

      const spriteSize = {
        x: playerSheet.clipSize.x * playerSheet.scaleFactor,
        y: playerSheet.clipSize.y * playerSheet.scaleFactor
      };
      const worldPos = playerMap.spawnPos;
      const viewPos = worldToView(camera, worldPos);

      this.id = 'player0';
      this.archetypeId = 'player';
      this.clip = new Rect({ x: 0, y: 0, w: playerSheet.clipSize.x, h: playerSheet.clipSize.y });
      this.view = new Rect({ x: viewPos.x, y: viewPos.y, w: spriteSize.x, h: spriteSize.y });
      this.world = { x: worldPos.x, y: worldPos.y };
      this.velocity = { x: 0, y: 0 };
      this.moveSpeed = 4;
      this.indoors = false;
      this.attacking = false;
      this.animationId = 'idleSouthArmed';

      this.moveDirection = MoveDirection.Stop;
      this.faceDirection = MoveDirection.South;

      this.attackBox = new Rect({ x: 0, y: 0, w: 64, h: 64 });
    }

    setDirection(moveDirection: MoveDirection): void {
      let stopped = false;

      switch (moveDirection){
        case MoveDirection.North:
          this.velocity.y = -1;
          this.animationId = 'walkNorthArmed';
          break;
        case MoveDirection.East:
          this.velocity.x = 1;
          this.animationId = 'walkEastArmed';
          break;
        case MoveDirection.South:
          this.velocity.y = 1;
          this.animationId = 'walkSouthArmed';
          break;
        case MoveDirection.West:
          this.velocity.x = -1;
          this.animationId = 'walkWestArmed';
          break;
        case MoveDirection.Stop:
          stopped = true;
          break;
      }

      if (stopped){
        let prevMoveDirection = this.moveDirection;

        switch (prevMoveDirection){
          case MoveDirection.North:
          this.velocity.y = 0;
          this.animationId = 'idleNorthArmed';
          break;
        case MoveDirection.East:
          this.velocity.x = 0;
          this.animationId = 'idleEastArmed';
          break;
        case MoveDirection.South:
          this.velocity.y = 0;
          this.animationId = 'idleSouthArmed';
          break;
        case MoveDirection.West:
          this.velocity.x = 0;
          this.animationId = 'idleWestArmed';
          break;
        }
      } else {
        this.faceDirection = moveDirection;
      }

      this.moveDirection = moveDirection;
    }

    update(worldBounds: Vector, collisionBoxes: Rect[]): void {

      if (this.attacking){
        this.frameCount++;

        if (this.frameCount > 20){
          this.frameCount = 0;
          this.attacking = false;
          this.animationId = this.prevAnimationId;
        }
      }


      // @TODO: Refactor into move function?
      // Check world bounds
      if (this.velocity.x < 0 && this.world.x <= 0){
        this.velocity.x = 0;
      } else if (this.velocity.x > 0 && ((this.world.x + this.view.w) > worldBounds.x)){
        this.velocity.x = 0;
      }
      if (this.velocity.y < 0 && this.world.y <= 0){
        this.velocity.y = 0;
      } else if (this.velocity.y > 0 && (this.world.y + this.view.h > worldBounds.y)){
        this.velocity.y = 0;
      }
    
      const easing = 5;
      const worldRect = new Rect({
        x: this.world.x + easing,
        y: this.world.y + easing,
        w: this.view.w - easing,
        h: this.view.h - easing
      });
      
      // Check box collision
      for (let box of collisionBoxes) {
        let collideDir = checkCollision(worldRect, box);
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

      // Place attack box so that it is in front of player according to direction.
      switch (this.faceDirection){
        case MoveDirection.North:
          this.attackBox.x = this.world.x;
          this.attackBox.y = this.world.y - this.view.h;
          break; 
        case MoveDirection.East:
          this.attackBox.x = this.world.x + this.view.w;
          this.attackBox.y = this.world.y;
          break; 
        case MoveDirection.South:
          this.attackBox.x = this.world.x;
          this.attackBox.y = this.world.y + this.view.h;
          break; 
        case MoveDirection.West:
          this.attackBox.x = this.world.x - this.view.w;
          this.attackBox.y = this.world.y;
          break; 
      }
    }

    attack(): void {
      this.attacking = true;
      this.prevAnimationId = this.animationId;
      this.frameCount = 0;

      switch (this.faceDirection){
        case MoveDirection.North:
          this.animationId = 'attackNorth';
          break; 
        case MoveDirection.East:
          this.animationId = 'attackEast';
          break; 
        case MoveDirection.South:
          this.animationId = 'attackSouth';
          break; 
        case MoveDirection.West:
          this.animationId = 'attackWest';
          break; 
      }
    }
  }

  export class Npc implements Entity, Sprite {
    id: string;
    archetypeId: string;
    clip: Rect;
    view: Rect;
    world: Vector;
    velocity: Vector;
    animationId: string;
    moveSpeed: number;

    hitpoints: number;

    // Local frame count
    frameCount = 0;
    hurting: boolean;

    constructor(camera: Camera, entityMap: any, entitySheet: Assets.Spritesheet){

      const spriteSize = {
        x: entitySheet.clipSize.x * entitySheet.scaleFactor,
        y: entitySheet.clipSize.y * entitySheet.scaleFactor
      };
      const worldPos = entityMap.spawnPos;
      const viewPos = worldToView(camera, worldPos);

      this.id = 'villager0';
      this.archetypeId = 'villager';
      this.clip = new Rect({ x: 0, y: 0, w: entitySheet.clipSize.x, h: entitySheet.clipSize.y });
      this.view = new Rect({ x: viewPos.x, y: viewPos.y, w: spriteSize.x, h: spriteSize.y });
      this.world = { x: worldPos.x, y: worldPos.y };
      this.velocity = { x: 0, y: 0 };
      this.moveSpeed = 3;
    
      this.animationId = 'idleSouth';
      this.hurting = false;
      this.hitpoints = 100;
    }

    update(/*worldBounds: Vector*/): void {
      if (this.hurting){
        this.frameCount++;
        if (this.frameCount > 20){
          this.frameCount = 0;
          this.hurting = false;
          this.animationId = 'idleSouth';
        }
      }

      this.world.x += this.velocity.x * this.moveSpeed;
      this.world.y += this.velocity.y * this.moveSpeed;
    }

    hurt(dmgVal: number){
      this.hurting = true;
      this.hitpoints -= dmgVal;
      if (this.hitpoints < 0){
        this.hitpoints = 0;
      }

      this.animationId = 'damageSouth';
    }
  }

  export function checkCollision(a: Rect, b: Rect): CollisionDirection {
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