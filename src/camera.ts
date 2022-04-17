import { Entities } from './entities';
import { Vector, Rect } from './primitives';

export class Camera{
  world: Rect;
  view: Rect;
  locked: {
    north: boolean,
    east: boolean,
    south: boolean,
    west: boolean
  }

  constructor(resolution: Vector, mapRes: Vector, playerWorld: Vector){
    this.world = new Rect({ x: 0, y: 0, w: mapRes.x, h: mapRes.y });
  
    const scrollsX = (resolution.x < this.world.w);
    const scrollsY = (resolution.y < this.world.h);
    const offset = {
      x: (!scrollsX) ? (resolution.x / 2) - (mapRes.x / 2) : 0,
      y: (!scrollsY) ? ((resolution.y) / 2) - (mapRes.y / 2) : 0
    };
    this.view = new Rect({
      x: offset.x,
      y: offset.y,
      w: resolution.x,
      h: resolution.y
    });

    const viewCenter = {
      x: resolution.x / 2,
      y: resolution.y / 2
    };
    let tooFarWest = ((playerWorld.x - viewCenter.x) < 0);
    let tooFarNorth = ((playerWorld.y - viewCenter.y) < 0);
    let tooFarEast = ((playerWorld.x + viewCenter.x) > mapRes.x);
    let tooFarSouth = ((playerWorld.y + viewCenter.y) > mapRes.y);
    this.world.x =  (tooFarWest) ? 0 : 
                    (tooFarEast) ? (mapRes.x - resolution.x) : 
                                   (playerWorld.x - viewCenter.x);
    this.world.y =  (tooFarNorth) ? 0 : 
                    (tooFarSouth) ? (mapRes.y - resolution.y) : 
                                    (playerWorld.y - viewCenter.y);
    
    this.locked = {
      north: (!scrollsY || this.world.y <= 0), 
      east: (!scrollsX) || (this.world.x + resolution.x >= mapRes.x), 
      south: (!scrollsY) || (this.world.y + resolution.y >= mapRes.y - 100), 
      west: (!scrollsX || this.world.x <= 0)
    };
  }

  update(player: Entities.Player): void {
    // Camera doesn't need to move if the map doesn't scroll (camera is locked in all directions)
    if (this.locked.north && this.locked.east && this.locked.south && this.locked.west){
      return;
    }
    
    // Lock camera
    if (player.velocity.x < 0 && this.world.x <= 0){
      this.locked.west = true;
    }
    else if (player.velocity.x > 0 && this.world.x + this.view.w >= this.world.w - 200){
      this.locked.east = true;
    }
  
    if (player.velocity.y < 0 && this.world.y <= 0){
      this.locked.north = true;
    }
    else if (player.velocity.y > 0 && this.world.y + this.view.h >= this.world.h - 200){
      this.locked.south = true;
    }
  
  
    // Unlock camera
    if (this.locked.west && (player.world.x + player.view.w > (this.view.w / 2) - (player.view.w / 2))){
      this.locked.west = false;
    }
    else if (this.locked.east && (player.world.x < this.world.w - (this.view.w / 2))){
      this.locked.east = false;
    }
    
    if (this.locked.north && (player.world.y > (this.view.h / 2 - (player.view.h / 2)))){
      this.locked.north = false;
    }
    else if (this.locked.south && (player.world.y < this.world.h - (this.view.h / 2))){
      this.locked.south = false;
    }
  
    if (this.locked.west === false && this.locked.east === false){
      const x = player.world.x - ((this.view.w / 2) - (player.view.w / 2));
      this.world.x = (x > 0) ? x : 0;
    }
    if (this.locked.north === false && this.locked.south === false){
      const y = player.world.y - ((this.view.h / 2) - (player.view.h / 2));
      this.world.y = (y > 0) ? y : 0;
    }
  }
}

export function worldToView(camera: Camera, world: Vector): Vector {
  // @TODO: Clamp offscreen values to just outside the view???
  return {
    x: camera.view.x + (world.x - camera.world.x),
    y: camera.view.y + (world.y - camera.world.y)
  };
}
