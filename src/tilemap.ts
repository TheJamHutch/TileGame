import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Rendering } from './rendering';
import { Assets } from './assets';

export namespace Tiling{

  export enum TileEffect {
    None = 0,
    Hurt,
    Teleport,
    Transition,
    Door,
    Roof
  }
  
  export type Tile = {
    pos: Vector;
    solid: boolean;
    effect: number;
  };
  
  export class Tilemap{
    // The original tile size before zoom
    tileSize: number;
    topLayerIdx: number;
    layers: TilemapLayer[];
    dimensions: Vector;
    resolution: Vector;
    transitionTiles: { idx: number, mapId: string }[];
  
    constructor(tilemap: any, tileSize: number){
      this.tileSize = tileSize;
      this.topLayerIdx = -1;
      this.dimensions = tilemap.dimensions;
      this.transitionTiles = tilemap.transitionTiles
      this.layers = [];

      for (let layer of tilemap.layers){
        this.layers.push(new TilemapLayer(layer, this.dimensions));
        this.topLayerIdx++;
      }
  
      this.resolution = { 
        x: this.dimensions.x * this.tileSize,
        y: this.dimensions.y * this.tileSize
      };
    }

    posToIndex(pos: Vector): number{
      return (pos.y * this.dimensions.x) + pos.x;
    }

    indexToPos(idx: number): Vector {
      let x = 0;
      let y = 0;
      let c = 0;

      while (c < idx){
        x++;
        if (x >= this.dimensions.x){
          x = 0;
          y++;
        }
        
        c++;
      }

      return { x, y };
    }

    pushHiddenTiles(layerIdx: number, tiles: Tile[]): void {
      this.layers[layerIdx].hiddenTiles.push(...tiles);
    }

    // @TOOD: popHiddenTiles ?

    clearHiddenTiles(layerIdx: number): void {
      this.layers[layerIdx].hiddenTiles = [];
    }

    isTileHidden(tileIdx: number, layerIdx: number): boolean {
      let isHidden = false;

      for (const htile of this.layers[layerIdx].hiddenTiles){
        // Get idx of the hidden tile
        const htileIdx = this.posToIndex(htile.pos);
        if (tileIdx === htileIdx){
          isHidden = true;
          break;
        }
      }
  
      return isHidden;
    }
  }
  
  export class TilemapLayer{
    tilesheetId: any;
    tiles: number[];
    hiddenTiles: any[];
  
    constructor(layer: { tilesheetId: string, tiles: number[] }, dimensions: Vector){
      this.tilesheetId = layer.tilesheetId;
      this.tiles = [];
      this.hiddenTiles = [];
  
      const nTiles = dimensions.x * dimensions.y;
      for (let i = 0; i < nTiles; i++)
      {
        if (!layer.tiles || layer.tiles.length === 0){
          this.tiles[i] = -1;
          continue;
        }
          
        if (layer.tiles[i] !== undefined){
          this.tiles[i] = layer.tiles[i];
        }
      }
    }


  }

  export function viewTiles(tilemap: Tilemap, camera: Camera): Tile[] {
    const inView = {
      x: Math.ceil(camera.view.w / tilemap.tileSize),
      y: Math.ceil(camera.view.h / tilemap.tileSize)
    };
    // 
    const start = {
      x: Math.floor(camera.world.x / tilemap.tileSize),
      y: Math.floor(camera.world.y / tilemap.tileSize)
    };
    const end = {
      x: (tilemap.dimensions.x > inView.x) ? start.x + inView.x : tilemap.dimensions.x, 
      y: (tilemap.dimensions.y > inView.y) ? start.y + inView.y : tilemap.dimensions.y
    };

    let viewTiles = [] as any;

    
    for (let i = 0; i <= tilemap.topLayerIdx; i++){
      for (let y = start.y; y < end.y; y++){
        for (let x = start.x; x < end.x; x++){
          const tileIdx = (y * tilemap.dimensions.x) + x;
          const layer = tilemap.layers[i];
          if (layer.tiles[tileIdx] > -1){
          
            const tileType = layer.tiles[tileIdx];
            const tilesheet = Assets.store.tilesheets[layer.tilesheetId];
            const solid = (tilesheet.solidMap[tileType] === 1) ? true : false;
            const effect = tilesheet.effectMap[tileType];
            const tile = {
              pos: { x, y },
              solid,
              effect
            };

            if (viewTiles[tileIdx]){
              viewTiles[tileIdx] = tile;
            } else {
              viewTiles.push(tile);
            }
          }
        }
      }
    }

    return viewTiles;
  }
  
  export function renderTilemap(tilemap: Tilemap, camera: Camera, frameCount: number): void {
    //
    const inView = {
      x: Math.ceil(camera.view.w / tilemap.tileSize),
      y: Math.ceil(camera.view.h / tilemap.tileSize)
    };
    // 
    const start = {
      x: Math.floor(camera.world.x / tilemap.tileSize),
      y: Math.floor(camera.world.y / tilemap.tileSize)
    };
    const end = {
      x: (tilemap.dimensions.x > inView.x) ? start.x + inView.x + 1 : tilemap.dimensions.x, 
      y: (tilemap.dimensions.y > inView.y) ? start.y + inView.y + 1 : tilemap.dimensions.y
    };
    
    const scrollsX = (tilemap.resolution.x > camera.view.w);
    const scrollsY = (tilemap.resolution.y > camera.view.h);
    const offset = {
      x: (!scrollsX) ? (camera.view.w / 2) - (tilemap.resolution.x / 2) : 0,
      y: (!scrollsY) ? ((camera.view.h) / 2) - (tilemap.resolution.y / 2) : 0
    };
    
    for (let i = 0; i <= tilemap.topLayerIdx; i++){
      for (let y = start.y; y < end.y; y++){
        for (let x = start.x; x < end.x; x++){
          const tileIdx = (y * tilemap.dimensions.x) + x;
          const layer = tilemap.layers[i];
          const tileType = layer.tiles[tileIdx];

          if (tileType > -1 && !tilemap.isTileHidden(tileIdx, i)){
            const sheet = Assets.store.tilesheets[layer.tilesheetId];
            const texture = Assets.store.textures[sheet.textureId];

            let clip = setClip(tileType, sheet.clipSize, sheet.dimensions);

            // Overwrite clip if tile is animated
            const tileIsAnimated = (sheet.animatedMap[tileType] === 1);
            if (tileIsAnimated){
              // Find the correct animation to use from the tilesheet.
              let animation = sheet.tileAnimations.find((anims: any) => anims.id === tileType);
              let animIdx = Math.floor(((frameCount / animation.speed) % animation.frames.length));
              let idx = animation.frames[animIdx];
              clip = setClip(idx, sheet.clipSize, sheet.dimensions);
            }
            
            const view = new Rect({ x: 0, y: 0, w: tilemap.tileSize, h: tilemap.tileSize });
            view.x = offset.x + ((x * tilemap.tileSize) - camera.world.x);
            view.y = offset.y + ((y * tilemap.tileSize) - camera.world.y);

            Rendering.renderBitmap(texture.bitmap, clip, view);
          }
        }
      }
    }
  }

  export function tilePosToWorldPos(tilemap: Tilemap, tilePos: Vector): Vector {
    return {
      x: tilePos.x * tilemap.tileSize,
      y: tilePos.y * tilemap.tileSize
    };
  }

  export function tilePosToWorldRect(tilemap: Tilemap, tilePos: Vector): Rect {
    return new Rect({
      x: tilePos.x * tilemap.tileSize,
      y: tilePos.y * tilemap.tileSize,
      w: tilemap.tileSize,
      h: tilemap.tileSize
    });
  }

  export function worldToTilePos(tilemap: Tilemap, worldPos){

  }

  export function getTileAtWorldPos(tilemap: Tilemap, worldPos: Vector): Tile {
    const tilePos = {
      x: Math.floor(worldPos.x / tilemap.tileSize),
      y: Math.floor(worldPos.y / tilemap.tileSize)
    };
    const tileIdx = tilemap.posToIndex(tilePos);
    let tile = {} as any;
    for (let layer of tilemap.layers){
      const sheet = Assets.store.tilesheets[layer.tilesheetId];
      const rawTile = layer.tiles[tileIdx];
      if (rawTile > -1){
        tile = {
          pos: tilePos,
          solid: sheet.solidMap[rawTile],
          effect: sheet.effectMap[rawTile]
        };
      }
    }

    

    return tile;
  }

  // Returns the position and size of the clipping rectangle of a spritesheet at a particular index.
  function setClip(index: number, cellSize: number, sheetDims: Vector): Rect {
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
  
    return new Rect({
      x: x * cellSize,
      y: y * cellSize, 
      w: cellSize, 
      h: cellSize
    });
  }
    
}
