import { Assets } from './assets';
import { Camera, worldToView } from './camera';
import { Rect, Vector } from './primitives';
import { Rendering } from './rendering';
import { Sprite, animateSprite } from './sprites';

export namespace Entities{
  export enum Direction {
    None = 0,
    North,
    East,
    South,
    West
  };

  export enum EntityState{
    Idle,
    Walk,
    Attack,
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
    state: EntityState;
    direction: Direction;
    armed?: boolean;
  }

  // Builds a string from the entitiy's state, direction etc. to use as the animation ID.
  export function getEntityAnimation(entity: Entity): string {
    let animationId = '';
    let skipTheRest = false;

    switch (entity.state){
      case EntityState.Idle:
        animationId += 'idle';
        break;
      case EntityState.Walk:
        animationId += 'walk';
        break;
      case EntityState.Attack:
        animationId += 'attack';
        break;
      case EntityState.Hurt:
        animationId += 'hurt';
        break;
      case EntityState.Down:
        animationId = 'down';
        skipTheRest = true;
        break;
    }
    

    if (!skipTheRest){
      switch(entity.direction){
        case Direction.North:
          animationId += '.north';
          break; 
        case Direction.East:
          animationId += '.east';
          break; 
        case Direction.South:
          animationId += '.south';
          break; 
        case Direction.West:
          animationId += '.west';
          break; 
      }
  
      if (entity?.armed){
        animationId += '.armed';
      }
    }
    
    return animationId;
  }

  export class Player implements Entity, Sprite {
    id: string;
    archetypeId: string;
    clip: Rect;
    view: Rect;
    world: Rect;
    area: Rect;
    velocity: Vector;
    moveSpeed: number;
    indoors: boolean;
    direction: Direction;
    hitpoints: number;

    // The number of frames that the entity has been in its current state for.
    state: EntityState;
    prevState: EntityState;
    stateFrameCount: number;
    armed? = true;

    prevAnimationId: string;

    prevAttacking = false;
    attacking: boolean = false;
    attackBox: Rect;

    constructor(camera: Camera, playerMap: any, playerSheet: Assets.Spritesheet){
      this.id = 'player0';
      this.archetypeId = 'player';
      this.velocity = { x: 0, y: 0 };
      this.indoors = false;
      this.prevState = EntityState.Idle;
      this.state = EntityState.Idle;
      this.stateFrameCount = 0;
      this.direction = Direction.South;

      const archetype = Assets.store.archetypes[this.archetypeId];
      this.moveSpeed = archetype.moveSpeed;
      this.hitpoints = archetype.hitpoints;

      // Init rects
      const worldPos = playerMap.spawnPos;
      const viewPos = worldToView(camera, worldPos);
      const spriteSize = {
        x: playerSheet.clipSize.x * playerSheet.scaleFactor,
        y: playerSheet.clipSize.y * playerSheet.scaleFactor
      };
      this.world = new Rect({ x: worldPos.x, y: worldPos.y, w: spriteSize.x, h: spriteSize.y });
      this.clip = new Rect({ x: 0, y: 0, w: playerSheet.clipSize.x, h: playerSheet.clipSize.y });
      this.view = new Rect({ x: viewPos.x, y: viewPos.y, w: spriteSize.x, h: spriteSize.y });
      this.area = new Rect({ 
        x: this.world.x - this.view.w, 
        y: this.world.y - this.view.h, 
        w: (this.view.w * 3), 
        h: (this.view.h * 3)
      });
      this.attackBox = new Rect({ x: 0, y: 0, w: (this.view.w / 2), h: (this.view.h / 2) });
    }

    move(moveDirection: Direction): void {
      let stopped = false;

      this.direction = moveDirection;
      this.changeState(EntityState.Walk);

      switch (this.direction){
        case Direction.North:
          this.velocity.y = -1;
          break;
        case Direction.East:
          this.velocity.x = 1;
          break;
        case Direction.South:
          this.velocity.y = 1;
          break;
        case Direction.West:
          this.velocity.x = -1;
          break;
      }
    }

    stop(): void {
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.changeState(EntityState.Idle);
    }

    update(worldBounds: Vector, collisionBoxes: Rect[]): void {

      if (this.prevAttacking){
        this.attacking = false;
        this.prevAttacking = false;
      }
      if (this.attacking){
        this.prevAttacking = true;
      }

      switch(this.state){
        case EntityState.Idle:
          break;
        case EntityState.Walk:
          this.updateWorldPos(worldBounds, collisionBoxes)
          break;
        case EntityState.Attack:
          if (this.stateFrameCount >= 20){      // @TODO: Hardcoded max frames for action/ state
            this.changeState(EntityState.Idle);
          }
          break;
        case EntityState.Hurt:
          if (this.stateFrameCount >= 20){
            this.changeState(EntityState.Idle);
          }
          break;
        case EntityState.Down:
          // Do nothing if entity down.
          break;
      }

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

      // Update player's area box
      this.area.x = this.world.x - this.view.w; 
      this.area.y = this.world.y - this.view.h;

      this.stateFrameCount++;
    }

    updateWorldPos(worldBounds: Vector, collisionBoxes: Rect[]): void {
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

      // Check box collision
      for (let box of collisionBoxes) {
        let collideDir = checkCollision(this.world, box);
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
    }

    attack(): void {
      this.attacking = true;
      this.changeState(EntityState.Attack);
    }

    hurt(dmgVal: number): void {
      if (this.state === EntityState.Down){
        return;
      }

      this.changeState(EntityState.Hurt);
      this.hitpoints -= dmgVal;
      if (this.hitpoints <= 0){
        this.hitpoints = 0;
        this.changeState(EntityState.Down);
      }
    }

    changeState(state: EntityState){
      this.stateFrameCount = 0;
      this.prevState = this.state;
      this.state = state;
    }
  }

  export class Npc implements Entity, Sprite {
    id: string;
    archetypeId: string;
    clip: Rect;
    view: Rect;
    world: Vector;
    velocity: Vector;
    moveSpeed: number;
    
    state: EntityState;
    prevState: EntityState;

    direction: Direction;

    movement = MovementPattern.Static;
    pathNodes?: Vector[];
    nextNode?: Vector;
    nodeIdx: number;
    reverse: boolean = false;
    armed = false;
    hitpoints: number;

    // Local frame count
    frameCount = 0;

    walking = false;
    walks = false;

    hurting = false;

    archetype: any;
    engaged = false;
    prevEngaged = false;

    hostile = false;

    attackBox: Rect;

    constructor(camera: Camera, entityMap: any, entitySheet: Assets.Spritesheet){
      this.id = 'villager0';
      this.archetypeId = entityMap.archetypeId;
      this.velocity = { x: 0, y: 0 };
      this.prevState = EntityState.Idle;
      this.state = EntityState.Idle;
      this.direction = Direction.South;

      // Init archetype
      this.archetype = Assets.store.archetypes[this.archetypeId];
      this.moveSpeed = this.archetype.moveSpeed;
      this.hitpoints = this.archetype.hitpoints;
      if (this.archetype.armed){
        this.armed = this.archetype.armed;
      }

      // Init rects
      const spriteSize = {
        x: entitySheet.clipSize.x * entitySheet.scaleFactor,
        y: entitySheet.clipSize.y * entitySheet.scaleFactor
      };
      const worldPos = entityMap.spawnPos;
      const viewPos = worldToView(camera, worldPos);
      this.clip = new Rect({ x: 0, y: 0, w: entitySheet.clipSize.x, h: entitySheet.clipSize.y });
      this.view = new Rect({ x: viewPos.x, y: viewPos.y, w: spriteSize.x, h: spriteSize.y });
      this.world = new Rect({ x: worldPos.x, y: worldPos.y, w: spriteSize.x, h: spriteSize.y });
      this.attackBox = new Rect({ x: 0, y: 0, w: (this.view.w / 2), h: (this.view.h / 2) });

      // Init path stuff
      this.pathNodes = [];
      if (entityMap.pathNodes){
        this.movement = MovementPattern.Path;
        for (let node of entityMap.pathNodes){
          this.pathNodes.push(node);
        }
        this.nextNode = this.pathNodes[0];
        this.state = EntityState.Walk;
        this.prevState = EntityState.Walk;
        this.walks = true;
      }
      this.nodeIdx = 0;

      if (this.walks){
        this.walking = true;
      }
    }

    update(): void {

      if (this.engaged){
        this.prevEngaged = true;

        // If ignore ...

        if (this.archetype.reasonable){
          this.state = EntityState.Idle;
          this.walking = false;
        }

        if (this.archetype.hostile){

        }

        // If hostile ...

  
      } else {
        if (this.prevEngaged){
          this.prevEngaged = false;

          if (this.walks){
            this.walking = true;
          }
        }
      }

      if (this.hurting){
        this.frameCount++;
        if (this.frameCount > 20){
          this.frameCount = 0;
          this.hurting = false;
        }
        this.state = EntityState.Hurt;
      } else if (this.walking){
        this.state = EntityState.Walk;
        if (this.movement === MovementPattern.Path){
          this.movePath();
        }
      }

      

      switch(this.state){
        case EntityState.Idle:
          break;
        case EntityState.Walk:
          break;
        case EntityState.Attack:
          break;
        case EntityState.Hurt:
          break;
        case EntityState.Down:
          // Do nothing if entity down.
          break;
      }

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

    movePath(): void {
      if (this.world.x < this.nextNode.x){
        this.velocity.x = 1;
        this.direction = Direction.East;
      } else if (this.world.x > this.nextNode.x){
        this.velocity.x = -1;
        this.direction = Direction.West;
      } else {
        this.velocity.x = 0;

        if (this.world.y < this.nextNode.y){
          this.velocity.y = 1;
          this.direction = Direction.South;
        } else if (this.world.y > this.nextNode.y){
          this.velocity.y = -1;
          this.direction = Direction.North;
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
      if (this.state === EntityState.Down){
        return;
      }

      this.hurting = true;
      this.hitpoints -= dmgVal;
      if (this.hitpoints <= 0){
        this.hitpoints = 0;
        this.state = EntityState.Down;
      }
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