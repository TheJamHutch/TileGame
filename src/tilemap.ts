import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Render } from './render';

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
  
  constructor(tileSize: TileSize, dimensions: Vector, tiles: Tile[] = []){
    this.id = 'tilemap';
    this.tileSize = tileSize;
    this.dimensions = dimensions;
    this.resolution = { 
      x: dimensions.x * tileSize,
      y: dimensions.y * tileSize
    },
    this.tiles = [];
    this.viewTiles = [];
  
    this.tiles = new Array(dimensions.x * dimensions.y) as any;

    // @TODO: The map editor should enforce that there is always a tile array in every map file. Therefore this code can be removed.
    _.fill(this.tiles, { texture: 0, effect: 0, dest: null });
    if (!_.isEmpty(tiles)){
      let idx = 0;
      for (const tile of tiles){
        this.tiles[idx] = { texture: tile.texture, effect: tile.effect, dest: null };
        idx++;
      }
    }
  }
  
  render(context: CanvasRenderingContext2D, textureSheet: Render.Bitmap, camera: Camera): void {
  
    function setClip(index: number, tileSize: number): Rect {
  
      let sheetDims = textureSheet.dimensions;
      let x = 0;
      let y = 0;
      let c = 0;
    
      while (c < index){
        x += 1;
        if (x >= sheetDims.x){
          x = 0;
          y++;
    
          if (y >= sheetDims.y){
            x = 0;
            y = 0;
          }
        }
    
        c++;
      }
    
      return {
        x: x * tileSize,
        y: y * tileSize, 
        w: tileSize, 
        h: tileSize
      };
    }
  
  
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
  
    let clip = { x: 0, y: 0, w: this.tileSize, h: this.tileSize };
    let dest = { x: 0, y: 0, w: this.tileSize, h: this.tileSize };
    for (let y = start.y; y < end.y; y++)
    {
      for (let x = start.x; x < end.x; x++)
      {
        const c = (y * this.dimensions.x) + x;
        clip = setClip(this.tiles[c].texture, this.tileSize);
        dest.x = (x * this.tileSize) - camera.world.x;
        dest.y = (y * this.tileSize) - camera.world.y;
        this.tiles[c].dest = dest;
  
        this.viewTiles.push(this.tiles[c]);
  
        Render.drawBitmap(context, textureSheet, clip, dest);
      }
    }
  }
}