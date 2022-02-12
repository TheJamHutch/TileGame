import { Vector } from './primitives';

export class Camera {

  velocity: Vector;
  world: Vector;
  worldBounds: Vector;
  resolution: Vector;
  locked: {
    north: boolean,
    east: boolean,
    south: boolean,
    west: boolean
  }

  constructor(resolution: Vector, mapRes: Vector, initPos: Vector) {
    this.velocity = { x: 0, y: 0 };
    this.world = initPos;
    this.worldBounds = mapRes;
    this.resolution = resolution;
    this.locked = {
      north: (this.world.y <= 0), 
      east: false, 
      south: false, 
      west: (this.world.x <= 0)
    };
    console.log(`Camera locks: N: ${this.locked.north}, E: ${this.locked.east}, S: ${this.locked.south}, W: ${this.locked.west}`);
  }
  
  update(playerPos: Vector): void {
    this.world.x = 
    /*
    // Moving west
    if (this.velocity.x < 0 && this.world.x <= 0){
      this.velocity.x = 0;
      this.locked.west = true;
    }
    // Moving east
    else if (this.velocity.x > 0 && this.world.x + this.resolution.x > this.worldBounds.x){
      this.velocity.x = 0;
      this.locked.east = true;
    }
    // Moving north
    if (this.velocity.y < 0 && this.world.y <= 0){
      this.velocity.y = 0;
      this.locked.north = true;
    }
    // Moving south
    else if (this.velocity.y > 0 && this.world.y + this.resolution.y > this.worldBounds.y){
      this.velocity.y = 0;
      this.locked.south = true;
    }
  
    if (!this.locked.west && !this.locked.east){
      this.world.x += (this.velocity.x * 2);
    }
    if (!this.locked.north && !this.locked.south){
      this.world.y += (this.velocity.y * 2);
    }*/
  }

}
