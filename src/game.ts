import { Rect, Vector } from './primitives';
import { Tile, Tilemap } from './tilemap';
import { Camera } from './camera'; 
import { Player } from './player';
import { Bitmap, loadBitmap, drawBitmap, drawLine, drawRect } from './render';
import { Events } from './events';
import { global } from './global';
import { Enemy, Enemies, spawnEnemy } from './enemies';
import { Sprite, SpriteSheet, animateSprite } from './sprites';
import * as _ from 'lodash';

import overworldMapJson from '../maps/overworld.json';
import dungeonMapJson from '../maps/dungeon.json';
import townMapJson from '../maps/town.json';
import roomMapJson from '../maps/room.json';
import badMapJson from '../maps/bad.json';

import playerSheetJson from '../sheets/player.json';
import slimeSheetJson from '../sheets/slime.json';

// @TODO: Move to const.ts file?
const MAX_FRAME_COUNT = 1000;
const TARGET_FPS = 60;

export class Game {

  resolution: Vector;
  camera?: Camera;
  player?: Player;
  textures: any;
  maps: any;
  sheets: any;
  context: CanvasRenderingContext2D;
  events: any;
  enemies: Enemies;
  tilemap: Tilemap;
  frameCount = 0;
  targetFps = 60;
  fps = TARGET_FPS;

  showDebugInfo: boolean = false;

  constructor(config: { resolution: Vector, initMap: string }, context: CanvasRenderingContext2D){
    this.context = context;
    this.resolution = config.resolution;

    this.events = global.eventsRef;

    this.enemies = new Enemies();

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
    this.maps['overworld'] = overworldMapJson;
    this.maps['dungeon'] = dungeonMapJson;
    this.maps['town'] = townMapJson;
    this.maps['room'] = roomMapJson;
    this.maps['bad'] = badMapJson;

    this.loadMap(config.initMap);

    // Load spritesheets
    this.sheets = {};
    this.sheets['player'] = new SpriteSheet(playerSheetJson);
    this.sheets['slime'] = new SpriteSheet(slimeSheetJson);
    
    this.events.register('mapChange', (mapName: string) => this.loadMap(mapName));
  }

  update(){
    this.events.poll();

    // Calculate collision boxes for player
    const enemyBoxes = this.enemies.getCollisionBoxes();
    let collisionBoxes: Rect[] = enemyBoxes.slice(0);
    for (let tile of this.tilemap.viewTiles){
      if (tile.effect === 1){
        collisionBoxes.push(tile.dest);
      }
    }
    

    this.player.update(collisionBoxes);
    this.camera.update(this.player);

    // Update player's view positon
    let view = this.camera.worldToView(this.player.world);
    this.player.view.x = view.x;
    this.player.view.y = view.y;

    animateSprite(this.player, this.sheets[this.player.id]);

    this.enemies.update(this.camera);

    this.render();

    this.frameCount++;
    global.frameCount = this.frameCount;
    if (this.frameCount >= MAX_FRAME_COUNT){
      this.fps = TARGET_FPS;
      this.frameCount = 0;
      global.frameCount = this.frameCount;
    }
  }

  private renderCollisionMesh(){
    this.context.fillStyle = 'red';

    const center = {
      x: this.resolution.x / 2,
      y: this.resolution.y / 2
    };

    drawLine(this.context, { x: 0, y: center.y }, { x: this.resolution.x, y: center.y });
    drawLine(this.context, { x: center.x, y: 0 }, { x: center.x, y: this.resolution.y });
    drawRect(this.context, this.player.view);
    
    const enemyBoxes = this.enemies.getCollisionBoxes();
    for (let box of enemyBoxes)
    {
      const view = this.camera.worldToView({ x: box.x, y: box.y });
      drawRect(this.context, new Rect({x: view.x, y: view.y, w: box.w, h: box.h }));
    }
  }

  private renderFrameCounter(){
    this.context.fillStyle = 'red';
    this.context.fillText(`Frame: ${this.frameCount}`, 540, 20);
    this.context.fillText(`FPS: ${this.fps}`, 540, 40);
  }

  private render(){

    this.context.fillStyle = 'black';
    this.context.fillRect(0, 0, 640, 480);
    
    this.tilemap.render(this.context, this.textures['tilemap'], this.camera);
  
    drawBitmap(this.context, this.textures[this.player.id], this.player.clip, this.player.view);
    
    // @TODO: Don't draw all enemies, only those that are in view
    for (let entity of this.enemies.enemiesList){
      drawBitmap(this.context, this.textures[entity.id], entity.clip, entity.view);
    }

    if (this.showDebugInfo)
    {
      this.renderCollisionMesh();
      this.renderFrameCounter();
    }
  }
  
  // @ TODO: Implement a MapLoader class with a load() function and a precache() function?
  loadMap(mapName: string): void
  {
    // Load raw map file from JSON.
    let rawMap = this.maps[mapName];

    // This map will be used if the required properties in the map file are either missing or incorrect.
    const failMap = {
      name: '_FAILMAP',
      dimensions: { x: 1, y: 1 },
      playerSpawn: { x: 0, y: 0 },
      tiles: [],
      enemies: []
    } as any;

    let gameMap = {} as any;

    let useFailMap = false;
    if (!rawMap){
      useFailMap = true;
      console.warn(`Failed to load map file: '${mapName}.json' not found.`);
    }
    else 
    {

      // Check map file's required fields are present and correct
      const mapNameWrong = (!rawMap.name || rawMap.name === '');
      const mapDimsWrong = (!rawMap.dimensions?.x || (rawMap.dimensions.x < 0 || rawMap.dimensions.y < 0)); 
      if (mapNameWrong)
      {
        useFailMap = true;
        console.warn(`Map file incorrect: name property is missing from '${mapName}.json'`);
      }
      if (mapDimsWrong)
      {
        useFailMap = true;
        console.warn(`Map file incorrect: dimensions property is missing from '${mapName}.json'`);
      }
    }

    if (useFailMap)
    {
      gameMap = failMap;
      console.warn(`Using default map: '${failMap.name}'`);
    } 
    else 
    {
      gameMap = {
        name: rawMap.name,
        dimensions: rawMap.dimensions,
        playerSpawn: (rawMap.playerSpawn) ? rawMap.playerSpawn : { x: 0, y: 0 },
        tiles: (rawMap.tiles) ? rawMap.tiles : [],
        enemies: (rawMap.enemies) ? rawMap.enemies : [] 
      }
    }

    this.tilemap = new Tilemap(32, gameMap.dimensions, gameMap.tiles);
    this.camera = new Camera(this.resolution, this.tilemap.resolution, gameMap.playerSpawn);
    this.player = new Player(gameMap.playerSpawn, { x: 32, y: 32 });

    global.worldBounds = this.tilemap.resolution;

    // Load enemies
    // @TODO: New instead ???
    this.enemies.load(gameMap.enemies);
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
      case 'c':
        this.showDebugInfo = !this.showDebugInfo;
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
