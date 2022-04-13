import { Vector } from "./primitives";
import { Rendering } from "./rendering";

export namespace Assets{

  const TEXTURES_PATH = 'assets/textures/';
  const MAPS_PATH = 'assets/maps/';
  const TILESHEETS_PATH = 'assets/tilesheets/';
  const SPRITESHEETS_PATH = 'assets/spritesheets/';

  const assetFiles = {
    textures: ['basetiles', 'overtiles', 'villager', 'slime', 'player'],
    maps: ['wretch', 'tesst', 'small', 'rev', 'empty'],
    tilesheets: ['basetiles', 'toptiles' ],
    spritesheets: ['player', 'slime', 'villager']
  };

  export const store = {
    textures: {},
    maps: {},
    tilesheets: {},
    spritesheets: {}
  } as any;

  export enum AssetType{
    Texture,
    GameMap,
    Tilesheet,
    Spritesheet
  }

  export type Texture = {
    id: string;
    bitmap: Rendering.Bitmap;  
  }

  export type GameMap = {
    id: string;
    name: string;
    tilemap: any;
    entities: any;
  }

  export type Tilesheet = {
    id: string;
    textureId: string;
    clipSize: number;
    dimensions: Vector;
    solidMap: number[];
    effectMap: number[];
  }

  export type Spritesheet = {
    id: string;
    name: string;
    dimensions: Vector;
    clipSize: Vector;
    scaleFactor: number;
    animations: any;
  }

  export async function loadAll(): Promise<any> {
    await loadTextures();
    await loadMaps();
    await loadTilesheets();
    await loadSpritesheets();
  }

  function createTexture(id: string, path: string){
    const bitmap = Rendering.createBitmap(path);
    const texture = { id, bitmap };
    return texture;
  }

  function createTilesheet(tilesheetJson: any): Tilesheet{
    let tilesheet = {} as any;
    Object.assign(tilesheet, tilesheetJson);
    return tilesheet as Tilesheet;
  }

  function createGameMap(mapJson: any): GameMap {
    let map = {} as any;
    Object.assign(map, mapJson);
    return map as GameMap;
  }

  function createSpritesheet(spritesheetJson: any){
    let spritesheet = {} as any;
    Object.assign(spritesheet, spritesheetJson);
    return spritesheet as Spritesheet;
  }

  async function fetchFileText(url: string): Promise<string>{
    const res = await fetch(url);
    const rawData = await res.text();

    return rawData;
  }

  async function fetchFileJson(url: string): Promise<any> {
    const res = await fetch(url);
    const rawJson = await res.json();
    return rawJson;
  }

  async function loadTextures(): Promise<any> {
    const ext = '.png';
    for (let fileName of assetFiles.textures){
      try{
        const url = TEXTURES_PATH + fileName + ext;
        
        const texture = createTexture(fileName, url);
        
        store.textures[texture.id] = texture;
      } catch(ex){
        console.warn(`Failed to load texture asset: ${fileName}${ext}`);
      }
    }
  }

  async function loadMaps(): Promise<any> {
    const ext = '.json';
    for (let fileName of assetFiles.maps){
      try{
        const url = MAPS_PATH + fileName + ext;
        const rawJson = await fetchFileJson(url);
        const map = createGameMap(rawJson);
        store.maps[map.id] = map;
      } catch(ex){
        console.warn(`Failed to load map asset: ${fileName}${ext}`);
      }
    }
  }
  
  async function loadTilesheets(): Promise<any> {
    const ext = '.json';
    for (let fileName of assetFiles.tilesheets){
      try{
        const url = TILESHEETS_PATH + fileName + ext;
        const rawJson = await fetchFileJson(url);

        const tilesheet = createTilesheet(rawJson);
        
        store.tilesheets[tilesheet.id] = tilesheet;
      } catch(ex){
        console.warn(`Failed to load tilesheet asset: ${fileName}${ext}`);
      }
    }
  }

  async function loadSpritesheets(): Promise<any> {
    const ext = '.json';
    for (let fileName of assetFiles.spritesheets){
      try{
        const url = SPRITESHEETS_PATH + fileName + ext;
        const rawJson = await fetchFileJson(url);

        const spritesheet = createSpritesheet(rawJson);
        
        store.spritesheets[spritesheet.id] = spritesheet;
      } catch(ex){
        console.warn(`Failed to load spritesheet asset: ${fileName}${ext}`);
      }
    }
  }
}
