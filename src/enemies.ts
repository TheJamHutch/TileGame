import { Tilemap, Tile } from './tilemap';
import { Camera } from './camera';
import { Rect, Vector } from './primitives';
import { Sprite, SpriteSheet, animateSprite } from './sprites';
import { global } from './global';

enum MovementPattern{
  Static,
  Path,
  Roam,
  Chase
}

export class Enemy implements Sprite {
  id: string;
  clip: Rect;
  view: Rect;
  world: Vector;
  velocity: Vector;
  animationkey: string;
  moveSpeed: number;

  constructor(startPos: Vector){
    this.id = 'slime';
    this.clip = new Rect({ x: 0, y: 0, w: 16, h: 16 });
    this.view = new Rect({ x: 0, y: 0, w: 32, h: 32 });
    this.world = { x: startPos.x, y: startPos.y };
    this.velocity = { x: 1, y: 0 };
    this.animationkey = 'idleSouth';
    this.moveSpeed = 1;
    
    // @TODO: Check requested startPos to see it fits in world. Use rect_contains function
    
  }

  update(){

  }
}

export class Enemies
{
  enemiesList: Enemy[];

  constructor()
  {
    this.enemiesList = [];
  }

  load(enemiesJson: any): void
  {
    this.enemiesList = [];
    for (let enemy of enemiesJson)
    {
      this.enemiesList.push(spawnEnemy(enemy.archetype, enemy.pathNodes[0]));
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

export function spawnEnemy(archetype: string, startPos: Vector): Enemy
{
  // Check start pos against world bounds

  // Get sheet, stats etc. from archetype map



  const enemy = new Enemy(startPos);
  return enemy;
}
