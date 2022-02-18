import { Player } from './player';
import { Vector } from './primitives';
import { Global } from './global';

export class Camera {
  world: Vector;
  worldBounds: Vector;
  view: Vector;
  scrollsX: boolean;
  scrollsY: boolean;
  locked: {
    north: boolean,
    east: boolean,
    south: boolean,
    west: boolean
  }

  constructor(resolution: Vector, mapRes: Vector, initPos: Vector) {
    this.world = initPos;
    this.worldBounds = mapRes;
    this.view = resolution;
    this.scrollsX = (this.worldBounds.x > this.view.x);
    this.scrollsY = (this.worldBounds.y > this.view.y);
    this.locked = {
      north: (!this.scrollsY || this.world.y <= 0), 
      east: (!this.scrollsX), 
      south: (!this.scrollsY), 
      west: (!this.scrollsX || this.world.x <= 0)
    };
    console.log(`scrollsX: ${this.scrollsX}, scrollsY: ${this.scrollsY}`);
    
    console.log('Camera locked:', this.locked);

    Global.eventsRef.register('reload', this.onReload.bind(this));

    Global.eventsRef.register('showPos', () => {
      console.log(this.locked);
      
    })
  }

  onReload(){
    console.log(this);
  }
  
  update(player: Player): void {

    if (!this.scrollsX && !this.scrollsY){
      return;
    }

    // Lock camera
    if (player.velocity.x < 0 && this.world.x <= 0){
      this.locked.west = true;
    }
    else if (player.velocity.x > 0 && this.world.x + this.view.x > this.worldBounds.x){
      this.locked.east = true;
    }

    if (player.velocity.y < 0 && this.world.y <= 0){
      this.locked.north = true;
    }
    else if (player.velocity.y > 0 && this.world.y + this.view.y > this.worldBounds.y - 200){
      this.locked.south = true;
    }


    // Unlock camera
    if (this.locked.west && (player.world.x + player.view.w > (this.view.x / 2))){
      this.locked.west = false;
    }
    else if (this.locked.east && (player.world.x < this.worldBounds.x - (this.view.x / 2))){
      this.locked.east = false;
    }
    
    if (this.locked.north && (player.world.y > (this.view.y / 2))){
      this.locked.north = false;
    }
    else if (this.locked.south && (player.world.y < this.worldBounds.y - (this.view.y / 2))){
      this.locked.south = false;
    }
  
    if (this.locked.west === false && this.locked.east === false){
      const x = player.world.x - (player.view.x % this.view.x);
      this.world.x = (x >= 0) ? x : 0;
    }
    if (this.locked.north === false && this.locked.south === false){
      const y = player.world.y - (player.view.y % this.view.y);
      this.world.y = (y >= 0) ? y : 0;
    }
  }

}