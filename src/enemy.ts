import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, animateSprite } from './sprites';
import { worldToView } from './camera';

enum MovementPattern{
  Static = 0,
  Path,
  Roam,
  Chase
}

class ReciprocatingList<T>{
  items: T[];
  top: number;
  forward: boolean;

  constructor(items: T[]){
    this.forward = true;
    this.items = items.slice(0);
    this.top = 0;
  }

  next(): T {
    if (this.items.length > 1){
      if (this.forward === true){
        if (this.top >= this.items.length - 1){
          this.forward = false;
          this.top = this.items.length - 1;
        }
        else {
          this.top++;
        }
      } 
      else {
        if (this.top <= 0){
          this.forward = true;
          this.top = 1;
        }
        else {
          this.top--;
        }
      }
    }

    return this.items[this.top];
  }

  push(items: T[]): void {
    this.items.push(...items);
  }
}

export type Enemy = {
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationKey: string;
  moveSpeed: number;
  moveWait: number;
  pathNodes: ReciprocatingList<Vector>;
  nextNode: Vector;
};

export function initEnemy(enemyJson: any){
  let enemy = {} as any;

  enemy.id = enemyJson.archetype;
  enemy.clip = new Rect({ x: 0, y: 0, w: 16, h: 16 });
  enemy.view = new Rect({ x: 0, y: 0, w: 32, h: 32 });
  enemy.world = { x: 0, y: 0 };
  enemy.velocity = { x: 1, y: 0 };
  enemy.animationKey = 'idleSouth';
  enemy.moveSpeed = 1;
  enemy.moveWait = enemyJson.moveWait;
  enemy.pathNodes = new ReciprocatingList<Vector>(enemyJson.pathNodes);
  
  // @TODO: Check requested startPos to see it fits in world. Use rect_contains function
  
  const start = {
    x: enemyJson.pathNodes[0].x,
    y: enemyJson.pathNodes[0].y
  };
  enemy.world.x = start.x;
  enemy.world.y = start.y;
  
  enemy.nextNode = enemy.pathNodes.next();

  return enemy;
}

export function updateEnemy(enemy: Enemy){
  if (enemy.world.x < enemy.nextNode.x)
    {
      enemy.velocity.x = 1;
      enemy.animationKey = 'walkEast';
    }
    else if (enemy.world.x > enemy.nextNode.x)
    {
      enemy.velocity.x = -1;
      enemy.animationKey = 'walkWest';
    }
    else 
    {
      enemy.velocity.x = 0;

      if (enemy.world.y < enemy.nextNode.y)
      {
        enemy.velocity.y = 1;
        enemy.animationKey = 'walkSouth';
      }
      else if (enemy.world.y > enemy.nextNode.y)
      {
        enemy.velocity.y = -1;
        enemy.animationKey = 'walkNorth';
      }
      else 
      {
        enemy.velocity.y = 0;
        enemy.nextNode = enemy.pathNodes.next();
      }
    }

    enemy.world.x += enemy.velocity.x * enemy.moveSpeed;
    enemy.world.y += enemy.velocity.y * enemy.moveSpeed;
}
