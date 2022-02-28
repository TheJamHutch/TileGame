import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet, animateSprite } from './sprites';
import { global } from './global';

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

export class Enemy implements Sprite {
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationkey: string;
  moveSpeed: number;
  moveWait: number;
  pathNodes: ReciprocatingList<Vector>;
  nextNode: Vector;

  constructor(enemyJson: any){
    this.id = enemyJson.archetype;
    this.clip = new Rect({ x: 0, y: 0, w: 16, h: 16 });
    this.view = new Rect({ x: 0, y: 0, w: 32, h: 32 });
    this.world = { x: 0, y: 0 };
    this.velocity = { x: 1, y: 0 };
    this.animationkey = 'idleSouth';
    this.moveSpeed = 1;
    this.moveWait = enemyJson.moveWait;
    this.pathNodes = new ReciprocatingList<Vector>(enemyJson.pathNodes);
    
    // @TODO: Check requested startPos to see it fits in world. Use rect_contains function
    
    const start = {
      x: enemyJson.pathNodes[0].x,
      y: enemyJson.pathNodes[0].y
    };
    this.world.x = start.x;
    this.world.y = start.y;
    
    this.nextNode = this.pathNodes.next();
  }

  update(){
    if (this.world.x < this.nextNode.x)
    {
      this.velocity.x = 1;
      this.animationkey = 'walkEast';
    }
    else if (this.world.x > this.nextNode.x)
    {
      this.velocity.x = -1;
      this.animationkey = 'walkWest';
    }
    else 
    {
      this.velocity.x = 0;

      if (this.world.y < this.nextNode.y)
      {
        this.velocity.y = 1;
        this.animationkey = 'walkSouth';
      }
      else if (this.world.y > this.nextNode.y)
      {
        this.velocity.y = -1;
        this.animationkey = 'walkNorth';
      }
      else 
      {
        this.velocity.y = 0;
        this.nextNode = this.pathNodes.next();
      }
    }

    this.world.x += this.velocity.x * this.moveSpeed;
    this.world.y += this.velocity.y * this.moveSpeed;
  }
}

export class Enemies
{
  enemiesList: Enemy[];

  constructor(enemiesJson: any)
  {
    this.enemiesList = [];
    for (let enemy of enemiesJson)
    {
      this.enemiesList.push(new Enemy(enemy));
    }
  }

  getCollisionBoxes(): Rect[]
  {
    let collisionBoxes: Rect[] = [];
    for (let enemy of this.enemiesList)
    {
      const box = new Rect({ 
        x: enemy.world.x, 
        y: enemy.world.y, 
        w: enemy.view.w, 
        h: enemy.view.h 
      });
      collisionBoxes.push(box);
    }

    return collisionBoxes;
  }

  update(camera: Camera): void
  {
    for (let enemy of this.enemiesList)
    {
      enemy.update();

      // Update view position
      let view = camera.worldToView(enemy.world);
      enemy.view.x = view.x;
      enemy.view.y = view.y;

      animateSprite(enemy, global.assetStoreRef.sheets[enemy.id]);
    }
  }

}
