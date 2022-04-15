import { Assets } from './assets';
import { Camera, worldToView } from './camera';
import { Rect, Vector } from './primitives';
import { Rendering } from './rendering';
import { Sprite, animateSprite } from './sprites';
import { Tiling } from './tilemap';

export namespace Entities{
  export enum Direction {
    None = 0,
    North,
    East,
    South,
    West
  };

  enum EntityState{ //@TODO: Action?
    Idle,
    Walk,
    Hurt,
    Down
  }

  enum MovementPattern{
    Static,
    Roam,
    Path
  }

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
    direction: Direction;

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

      this.direction = Direction.South;

      this.attackBox = new Rect({ x: 0, y: 0, w: (this.view.w / 2), h: (this.view.h / 2) });
    }

    move(moveDirection: Direction): void {
      let stopped = false;

      this.direction = moveDirection;

      switch (this.direction){
        case Direction.North:
          this.velocity.y = -1;
          this.animationId = 'walkNorthArmed';
          break;
        case Direction.East:
          this.velocity.x = 1;
          this.animationId = 'walkEastArmed';
          break;
        case Direction.South:
          this.velocity.y = 1;
          this.animationId = 'walkSouthArmed';
          break;
        case Direction.West:
          this.velocity.x = -1;
          this.animationId = 'walkWestArmed';
          break;
      }
    }

    stop(): void {
      this.velocity.x = 0;
      this.velocity.y = 0;
      
      switch (this.direction){
        case Direction.North:
        this.animationId = 'idleNorthArmed';
        break;
      case Direction.East:
        this.animationId = 'idleEastArmed';
        break;
      case Direction.South:
        this.animationId = 'idleSouthArmed';
        break;
      case Direction.West:
        this.animationId = 'idleWestArmed';
        break;
      }
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
        if (this.velocity.x > 0 && collideDir === Direction.East){
          this.velocity.x = 0;
        } else if (this.velocity.x < 0 && collideDir === Direction.West){
          this.velocity.x = 0;
        }
        if (this.velocity.y > 0 && collideDir === Direction.North){
          this.velocity.y = 0;
        } else if (this.velocity.y < 0 && collideDir === Direction.South){
          this.velocity.y = 0;
        }
      }
      
      this.world.x += this.velocity.x * this.moveSpeed;
      this.world.y += this.velocity.y * this.moveSpeed;

      // Place attack box so that it is in front of player according to direction.
      switch (this.direction){
        case Direction.North:
          this.attackBox.x = this.world.x + (this.view.h / 4);
          this.attackBox.y = this.world.y - this.attackBox.h;
          break; 
        case Direction.East:
          this.attackBox.x = this.world.x + this.view.w;
          this.attackBox.y = this.world.y + (this.view.h / 4);
          break; 
        case Direction.South:
          this.attackBox.x = this.world.x + (this.view.h / 4);
          this.attackBox.y = this.world.y + this.view.h;
          break; 
        case Direction.West:
          this.attackBox.x = this.world.x - this.attackBox.w;
          this.attackBox.y = this.world.y + (this.view.h / 4);
          break; 
      }
    }

    attack(): void {
      this.attacking = true;
      this.prevAnimationId = this.animationId;
      this.frameCount = 0;

      switch (this.direction){
        case Direction.North:
          this.animationId = 'attackNorth';
          break; 
        case Direction.East:
          this.animationId = 'attackEast';
          break; 
        case Direction.South:
          this.animationId = 'attackSouth';
          break; 
        case Direction.West:
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
    
    entityState: EntityState;

    movement = MovementPattern.Static;
    pathNodes?: Vector[];
    nextNode?: Vector;
    nodeIdx: number;
    reverse: boolean = false;

    hitpoints: number;

    // Local frame count
    frameCount = 0;
    hurting: boolean;

    down: boolean;

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
      this.moveSpeed = 1;

      this.entityState = EntityState.Idle;

      this.pathNodes = [];
      if (entityMap.pathNodes){
        this.movement = MovementPattern.Path;
        for (let node of entityMap.pathNodes){
          this.pathNodes.push(node);
        }
        this.nextNode = this.pathNodes[0];
      }
      this.nodeIdx = 0;
    
      this.animationId = 'idleSouth';
      this.hurting = false;
      this.hitpoints = 100;

      this.down = false;
    }

    update(): void {
      if (this.down){
        this.animationId = 'down';
        return;
      }

      if (this.hurting){
        this.frameCount++;
        if (this.frameCount > 20){
          this.frameCount = 0;
          this.hurting = false;
          this.animationId = 'idleSouth';
        }

        return;
      }

      if (this.movement === MovementPattern.Roam){
        
      } else if (this.movement === MovementPattern.Path){
        this.movePath();
      }
      
    }

    movePath(): void {
      if (this.world.x < this.nextNode.x){
        this.velocity.x = 1;
        this.animationId = 'walkEast';
      } else if (this.world.x > this.nextNode.x){
        this.velocity.x = -1;
        this.animationId = 'walkWest';
      } else {
        this.velocity.x = 0;

        if (this.world.y < this.nextNode.y){
          this.velocity.y = 1;
          this.animationId = 'walkSouth';
        } else if (this.world.y > this.nextNode.y){
          this.velocity.y = -1;
          this.animationId = 'walkNorth';
        } else {
          this.velocity.y = 0;

          

          if (this.nodeIdx >= this.pathNodes.length - 1){
            this.reverse = true;
          } else if (this.nodeIdx <= 0){
            this.reverse = false;
          }
          if (this.reverse){
            
            this.nodeIdx--;
          } else {
            this.nodeIdx++;
          }

          this.nextNode = this.pathNodes[this.nodeIdx];
        }
      }

      this.world.x += this.velocity.x * this.moveSpeed;
      this.world.y += this.velocity.y * this.moveSpeed;
    }

    hurt(dmgVal: number){
      if (this.down){
        return;
      }

      this.hurting = true;
      this.hitpoints -= dmgVal;
      if (this.hitpoints <= 0){
        this.hitpoints = 0;
        this.down = true;
      }

      this.animationId = 'damageSouth';
    }
  }

  export function checkCollision(a: Rect, b: Rect): Direction {
    const collision = ((a.right > b.left && a.left < b.right) && (a.top < b.bottom && a.bottom > b.top));
    let collideDir = Direction.None;
  
    if (collision){
      collideDir =  (a.left - b.right > 0 && a.right - b.left < 0) ? Direction.East :
                    (a.left - b.right > 0 && a.right - b.left < 0) ? Direction.West : Direction.None;
               
      let xc = a.left - b.left;
      let yc = a.top - b.top;
  
      if (Math.abs(xc) > Math.abs(yc)){
        if (xc < 0){
          collideDir = Direction.East;
        } else if (xc > 0){
          collideDir = Direction.West;
        }
      } else {
        if (yc < 0){
          collideDir = Direction.North;
        } else if (yc > 0){
          collideDir = Direction.South;
        }
      }
    }
    
    return collideDir;
  }
}