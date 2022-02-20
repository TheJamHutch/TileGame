import { Rect, Vector, rect_contains } from './primitives';
import { Tilemap } from './tilemap';
import { Camera } from './camera'; 
import { Player } from './player';
import { Bitmap, loadBitmap, drawBitmap, drawLine } from './render';
import { Events } from './events';
import { global } from './global';
import { Enemy } from './enemy';
import * as _ from 'lodash';

import overworldMapJson from '../maps/overworld.json';
import dungeonMapJson from '../maps/dungeon.json';
import townMapJson from '../maps/town.json';
import roomMapJson from '../maps/room.json';

import playerSheetJson from '../sheets/player.json';
import { Sprite, SpriteSheet, animateSprite } from './sprites';

type GameMap = {
  id: string,
  tilemap: Tilemap,
  playerSpawn: Vector
};

export class Game {

  resolution: Vector;
  camera?: Camera;
  player?: Player;
  activeMap?: GameMap;
  textures: any;
  maps: any;
  sheets: any;
  context: CanvasRenderingContext2D;
  events: any;

  enemy: Enemy;

  frameCount = 0;
  targetFps = 60;
  fps = 60;

  constructor(config: { resolution: Vector, initMap: string }, context: CanvasRenderingContext2D){
    this.context = context;
    this.resolution = config.resolution;

    this.events = global.eventsRef;

    this.init(config);
  }

  private init(config: { resolution: Vector, initMap: string }){
    // Init graphics context
    this.context.font = '16px consolas';

    // Load textures
    this.textures = {};
    this.textures['tilemap'] = loadBitmap('./img/basetiles.png');
    this.textures['player'] = loadBitmap('./img/player.png');
    this.textures['slime'] = loadBitmap('./img/slime.png');

    // Load maps
    this.maps = {};
    this.maps['overworld'] = this.createMap(overworldMapJson);
    this.maps['dungeon'] = this.createMap(dungeonMapJson);
    this.maps['town'] = this.createMap(townMapJson);
    this.maps['room'] = this.createMap(roomMapJson);

    this.activeMap = this.maps[config.initMap];

    // Create game objects
    
    this.camera = new Camera(this.resolution, this.activeMap.tilemap.resolution, this.activeMap.playerSpawn);
    this.player = new Player(this.activeMap.playerSpawn, { x: 32, y: 32 });
    this.enemy = new Enemy();

    // Load spritesheets
    this.sheets = {};
    this.sheets[this.player.id] = new SpriteSheet(playerSheetJson);
    
    this.events.register('mapChange', (mapName: string) => this.changeMap(mapName));
  }

  private worldToView(world: Vector): void {

  }

  private entitiesInView(): Enemy[]
  {
    let visibleEntities = [];

    if ((this.enemy.world.x + 32 > this.camera.world.x) && 
        (this.enemy.world.x + 32 < this.camera.world.x + 640) && 
        (this.enemy.world.y + 32 > this.camera.world.y) && 
        (this.enemy.world.y + 32 < this.camera.world.y + 480))
    {
      visibleEntities.push(this.enemy);
    }

    return visibleEntities;
  }

  update(){
    this.events.poll();

    this.camera.update(this.player);

    this.player.update(this.camera, this.activeMap.tilemap.resolution, this.activeMap.tilemap.viewTiles);
    animateSprite(this.player, this.sheets[this.player.id]);

    this.enemy.view.x = this.enemy.world.x - this.camera.world.x;
    this.enemy.view.y = this.enemy.world.y - this.camera.world.y;

    this.render(this.entitiesInView());

    this.frameCount++;
    global.frameCount = this.frameCount;
    if (this.frameCount >= this.targetFps){
      this.fps = this.frameCount;
      this.frameCount = 0;
      global.frameCount = this.frameCount;
    }
  }

  private render(entities: Enemy[]){

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, 640, 480);
    
    this.activeMap.tilemap.render(this.context, this.textures['tilemap'], this.camera);
  
    drawBitmap(this.context, this.textures[this.player.id], this.player.clip, this.player.view);
    
    for (let entity of entities){
      drawBitmap(this.context, this.textures[entity.id], entity.clip, entity.view);
    }
    
    this.context.fillStyle = 'red';
    this.context.fillText(`Frame: ${this.frameCount}`, 550, 20);
    this.context.fillText(`FPS: ${this.fps}`, 550, 40);
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
  
    return gameMap;
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
        this.player.animationkey = 'walkNorth';
        break;
      case 's':
        this.player.velocity.y = 1;
        this.player.animationkey = 'walkSouth';
        break;
      case 'a':
        this.player.velocity.x = -1;
        this.player.animationkey = 'walkWest';
        break;
      case 'd':
        this.player.velocity.x = 1;
        this.player.animationkey = 'walkEast';
        break;
    }
  }

  onKeyUp(key: string){
    switch(key){
      case 'w':
        this.player.velocity.y = 0;
        this.player.animationkey = 'idleNorth';
        break;
      case 's':
        this.player.velocity.y = 0;
        this.player.animationkey = 'idleSouth';
        break;
      case 'a':
        this.player.velocity.x = 0;
        this.player.animationkey = 'idleWest';
        break;
      case 'd':
        this.player.velocity.x = 0;
        this.player.animationkey = 'idleEast';
        break;
    }
  }
}
