import { Rect, Vector } from './primitives';
import { Tilemap } from './tilemap';
import { Camera } from './camera'; 
import { Player } from './player';
import { Render } from './render';
import { Events } from './events';
import { Global } from './global';
import * as _ from 'lodash';

import overworldMapJson from '../maps/overworld.json';
import dungeonMapJson from '../maps/dungeon.json';
import townMapJson from '../maps/town.json';
import roomMapJson from '../maps/room.json';

import playerSheetJson from '../sheets/player.json';
import { createSpritesheet, SpriteAnimation, SpriteSheet } from './sprites';

type GameMap = {
  id: string,
  tilemap: Tilemap,
  playerSpawn: Vector
};

export class Game {
  

  // @TODO: Event listeners?

  resolution: Vector;
  camera?: Camera;
  player?: Player;
  activeMap?: GameMap;
  textures: any;
  maps: any;
  sheets: any;
  context: CanvasRenderingContext2D;
  events: any;

  get cameraPos(){
    return {
      x: this.camera.world.x,
      y: this.camera.world.y
    };
  }

  get playerPos(){
    return {
      x: this.player.world.x,
      y: this.player.world.y
    };
  }

  constructor(config: { resolution: Vector, initMap: string }, context: CanvasRenderingContext2D){
    this.context = context;
    this.resolution = config.resolution;

    this.events = Global.eventsRef;

    this.init(config);
  }

  private init(config: { resolution: Vector, initMap: string }){
    // Init graphics context
    this.context.font = '16px consolas';

    // Load textures
    this.textures = {};
    this.textures['tilemap'] = Render.loadBitmap('./img/basetiles.png');
    this.textures['player'] = Render.loadBitmap('./img/player.png');

    // Load maps
    this.maps = {};
    this.maps['overworld'] = this.createMap(overworldMapJson);
    this.maps['dungeon'] = this.createMap(dungeonMapJson);
    this.maps['town'] = this.createMap(townMapJson);
    this.maps['room'] = this.createMap(roomMapJson);

    // Create game objects
    this.activeMap = this.maps[config.initMap];
    
    this.camera = new Camera(this.resolution, this.activeMap.tilemap.resolution, this.activeMap.playerSpawn);
    this.player = new Player(this.activeMap.playerSpawn, { x: 32, y: 32 });

    // Load spritesheets
    this.sheets = {};
    this.sheets[this.player.id] = createSpritesheet(this.textures['player'], playerSheetJson);

    this.events.register('mapChange', (mapName: string) => this.changeMap(mapName));

    // @TODO: Remove
    this.events.register('showPos', (context: any) => {
      console.log('World:', this.player.world);
      console.log('View:', this.player.view);
    })
  }

  private render(){

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, 640, 480);
    
    this.activeMap.tilemap.render(this.context, this.textures['tilemap'], this.camera);
  
    Render.drawBitmap(this.context, this.sheets[this.player.id].texture, this.player.clip, this.player.view)
    
    this.context.fillStyle = 'yellow';
    //context.fillText(`Frames: ${this.timer.frameCount}`, 5, 20);
    //context.fillText(`FPS: ${this.timer.fps}`, 5, 40);
  }

  update(){
    this.events.poll();

    this.camera.update(this.player);
    this.player.update(this.camera, this.activeMap.tilemap.resolution, this.activeMap.tilemap.viewTiles);
    this.render();
  }

  private createMap(rawMap: any): GameMap{

    // Check rawmap properties
  
    let gameMap = {
      id: rawMap.name,
      tilemap: new Tilemap(32, rawMap.dimensions, rawMap.tiles),
      playerSpawn: {
        x: rawMap.playerSpawn.x,
        y: rawMap.playerSpawn.y
      }
    };
  
    return gameMap
  }
  
  changeMap(mapName: string): void {
    if (this.maps[mapName]){
      this.activeMap = this.maps[mapName];
    } else {
      console.warn(`Failed to change map. Map: ${mapName}.json not found`);
      return;
    }
  
    // Set new camera position
    const camWorld = {
      x: this.activeMap.playerSpawn.x - (this.resolution.x / 2),
      y: this.activeMap.playerSpawn.y - (this.resolution.y / 2)
    }
    this.camera.world.x = (camWorld.x > 0) ? camWorld.x: 0;
    this.camera.world.y = (camWorld.y > 0) ? camWorld.y: 0;
  
    const newPos = this.activeMap.playerSpawn;
    this.player.world = newPos;
    this.player.view.x = newPos.x;
    this.player.view.y = newPos.y;
  }

  onKeyDown(key: string){
    switch(key){
      case 'w':
        this.player.velocity.y = -1;
        break;
      case 's':
        this.player.velocity.y = 1;
        break;
      case 'a':
        this.player.velocity.x = -1;
        break;
      case 'd':
        this.player.velocity.x = 1;
        break;
      case 'x':
        this.events.raise('showPos', null);
        break;
    }
  }

  onKeyUp(key: string){
    switch(key){
      case 'w':
      case 's':
        this.player.velocity.y = 0;
        break;
      case 'a':
      case 'd':
        this.player.velocity.x = 0;
        break;
    }
  }
}
