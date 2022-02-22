import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Bitmap, loadBitmap, drawBitmap } from './render';
import { setClip } from './sprites';

export enum TileSize {
  SMALL = 8,
  MEDIUM = 16,
  LARGE = 32
};

export type Tile = {
  texture: number;
  effect: number;
  dest?: Rect;
};

export class Tilemap{
  id: string;
  tileSize: TileSize;
  dimensions: Vector;
  resolution: Vector;
  tiles: Tile[];
  viewTiles: Tile[];
  
  constructor(tileSize: TileSize, dimensions: Vector, tiles: Tile[]){
    this.id = 'tilemap';
    this.tileSize = tileSize;
    this.dimensions = dimensions;
    this.resolution = { 
      x: dimensions.x * tileSize,
      y: dimensions.y * tileSize
    },
    this.tiles = []; 
    this.viewTiles = [];

    // Insert tiles from param

    // @TODO: The map editor should enforce that there is always a tile array in every map file. Therefore this code can be removed.
    const nTiles = dimensions.x * dimensions.y;
    
    let blankMap = false;
    const blankTile = { texture: 0, effect: 0, dest: null } as any;
    if (!tiles || tiles.length < nTiles){
      blankMap = true;
    }
    for (let i = 0; i <= nTiles; i++)
    {
      this.tiles[i] = (!blankMap) ? tiles[i] : blankTile;
    }
  }
  
  render(context: CanvasRenderingContext2D, textureSheet: Bitmap, camera: Camera): void {
  
    this.viewTiles.splice(0, this.viewTiles.length);
  
    const start = {
      x: Math.floor(camera.world.x / this.tileSize),
      y: Math.floor(camera.world.y / this.tileSize)
    };
    const inView = {
      x: camera.view.x / this.tileSize,
      y: camera.view.y / this.tileSize
    };
    /*
    const offset = {
      x: (camera.view.w < tilemap.resolution.x) ? camera.view.x + ((camera.view.w) / 2) : camera.view.x,
      y: (camera.view.h < tilemap.resolution.y) ? camera.view.y + ((camera.view.h) / 2) : camera.view.y
    };*/
    const end = {
      x: (this.dimensions.x > inView.x) ? start.x + inView.x + 1 : this.dimensions.x, 
      y: (this.dimensions.y > inView.y) ? start.y + inView.y + 1 : this.dimensions.y
    };
  
    let clip = new Rect({ x: 0, y: 0, w: this.tileSize, h: this.tileSize });
    let dest = new Rect({ x: 0, y: 0, w: this.tileSize, h: this.tileSize });
    for (let y = start.y; y < end.y; y++)
    {
      for (let x = start.x; x < end.x; x++)
      {
        const c = (y * this.dimensions.x) + x;
        clip = setClip(this.tiles[c].texture, this.tileSize, textureSheet.dimensions);
        dest.x = (x * this.tileSize) - camera.world.x;
        dest.y = (y * this.tileSize) - camera.world.y;
  
        const worldTile = this.tiles[c];
        worldTile.dest = new Rect({ 
          x: x * this.tileSize, 
          y: y * this.tileSize, 
          w: this.tileSize, 
          h: this.tileSize
        });
        this.viewTiles.push(worldTile);

        drawBitmap(context, textureSheet, clip, dest);
      }
    }
  }
}
