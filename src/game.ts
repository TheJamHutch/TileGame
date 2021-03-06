import { Rect, Vector } from './primitives';
import { Tiling } from './tilemap';
import { Camera, worldToView } from './camera'; 
import { Entities } from './entities';
import { Rendering } from './rendering';
import { Sprite, animateSprite } from './sprites';
import { Gui } from './gui';
import { Assets } from './assets';
import * as _ from 'lodash';

export namespace Game{

  // Each map layer has a specific, hardcoded purpose.
  enum MapLayer{
    Terrain = 0,  // Grass, sand, water etc.
    Scenery,      // Trees, rocks, interior decorations (i.e. tables)
    Glass,        // Windows and windowed doors. These light up at night.
    Roof          // Roof and door tiles that disappear when the player walks inside.
  }

  /*
  enum TimeOfDay{
    Dawn = 0,
    Morning,
    Day,
    Evening,
    Dusk,
    Night
  };*/

  class TimeOfDay{
    readonly MAX_SECONDS = 59;
    readonly MAX_MINUTES = 23;

    minutes: number;
    seconds: number;

    constructor(tod: { minutes: number, seconds: number }){
      this.minutes = tod.minutes;
      this.seconds = tod.seconds;
    }

    increment(): void {
      this.seconds += 1;
      if (this.seconds > this.MAX_SECONDS){
        this.minutes++;
        this.seconds = 0;
      }

      if (this.minutes > this.MAX_MINUTES){
        this.minutes = 0;
      }
    }

    toString(): string {
      let minPrefix = (this.minutes < 10) ? '0' : '';
      let secPrefix = (this.seconds < 10) ? '0' : '';

      return `${minPrefix}${this.minutes}:${secPrefix}${this.seconds}`;
    }
  }

  export let keyDown: string;

  const state = {} as any;

  export function init(config: any){
    state.resolution = config.resolution;
    state.frameCount = 0;
    
    const initMap = Assets.store.maps[config.initMapId];
    
    state.tilemap = new Tiling.Tilemap(initMap.tilemap, config.tileSize);

    // Find the entity with the player archetype in the list of map entities.
    const playerArchetypeId = 'player';
    const playerIdx = initMap.entities.findIndex((entity: any) => entity.archetypeId === playerArchetypeId);
    let playerSheet = Assets.store.spritesheets[playerArchetypeId];
    let playerMap = initMap.entities[playerIdx];
    
    const playerWorld = playerMap.spawnPos;
    state.camera = new Camera(state.resolution, state.tilemap.resolution, playerWorld);
    state.player = new Entities.Player(state.camera, playerMap, playerSheet);

    // Remove player from the list of map entities
    initMap.entities.splice(playerIdx, 1);

    state.npcs = [];
    for (let rawEntity of initMap.entities){
      let npc = new Entities.Npc(state.camera, rawEntity, Assets.store.spritesheets[rawEntity.archetypeId]);
      state.npcs.push(npc);
    }

    state.prevMapId = initMap.id;
    state.mapId = initMap.id;

    state.config = config;

    // Init Day-Night cycle.
    state.timeOfDay = new TimeOfDay({ minutes: 11, seconds: 59 });
    setInterval(() => {
      state.timeOfDay.increment();
      
      /*
        if (state.timeOfDay.minutes > 19  || state.timeOfDay.minutes < 5){
          state.tilemap.layers[2].tilesheet.textureId = 'glass_night';
        } else {
          state.tilemap.layers[2].tilesheet.textureId = 'glass';
        }
        */
    }, 1000);
  }

  function handleKeypress(): void {
    if (state.keyboardState === 'keydown'){
      switch(state.keycode){
        case 'KeyW':
          state.player.move(Entities.Direction.North);
          break;
        case 'KeyS':
          state.player.move(Entities.Direction.South);
          break;
        case 'KeyA':
          state.player.move(Entities.Direction.West); 
          break;
        case 'KeyD':
          state.player.move(Entities.Direction.East);
          break;
        case 'Space':
          state.player.attack();
          console.log(state.tilemap);
          
          break;
      }
    } else if (state.keyboardState === 'keyup'){
      switch(state.keycode){
        case 'KeyW':
        case 'KeyS':
        case 'KeyA':
        case 'KeyD':
          state.player.stop();
          break;
      }
    }

    state.keyboardState = '';
    state.keycode = '';
  }

  export function update(){
    handleKeypress();

     // Get everything collide-able for the player
    let collisionBoxes = [];
    // Solid tiles
    const viewTiles = Tiling.viewTiles(state.tilemap, state.camera);
    for (let tile of viewTiles){
      if (tile.solid){
        const worldRect = Tiling.tilePosToWorldRect(state.tilemap, tile.pos);
        collisionBoxes.push(worldRect);
      }
    }
    // Solid entities
    for (let entity of state.npcs){
      collisionBoxes.push(entity.world);
    }


    state.camera.update(state.player);

    state.player.update(state.tilemap.resolution, collisionBoxes);
    playerOnEffectTile(viewTiles);


    // Update all NPCS 
    for (let npc of state.npcs){
      
      // If player is within range of the NPC
        if (Entities.checkCollision(state.player.area, npc.world)){
          npc.engaged = true;

          if (Entities.checkCollision(state.player.attackBox, npc.world)){
            if (state.player.attacking){
              npc.hurt(10);
              npc.hostile = true;
            }
          }

          // Entity faces player while engaged
          let pc = state.player.world.centerAbsolute();
          if (pc.y < npc.world.top){
            npc.direction = Entities.Direction.North;
          } else if (pc.y > npc.world.bottom ){
            npc.direction = Entities.Direction.South;
          }

          if (state.player.world.right < npc.world.left){
            npc.direction = Entities.Direction.West;
          } else if (state.player.world.left > npc.world.right){
            npc.direction = Entities.Direction.East;
          }

        
        } else {
          if (npc.engaged){
            npc.engaged = false;
          }
        }

      npc.update();
    }
  
    // Update view position for all entities including player
    // @TODO: Only update view pos of entities that are actually in view (or near to it so that offscreen entities can enter the view).
    for (let entity of allEntities()){
      let view = worldToView(state.camera, entity.world);
      entity.view.x = view.x;
      entity.view.y = view.y;
    }

    // Animate all sprites
    for (let entity of allEntities()){
      const sheet = Assets.store.spritesheets[entity.archetypeId];
      const animId = Entities.getEntityAnimation(entity);
      const anim = sheet.animations[animId] as any;
      animateSprite(entity, anim, state.frameCount);
    }

    render();
  
    state.frameCount++;
    if (state.frameCount > 1000){
      state.frameCount = 0;
    }
  }

  function playerOnEffectTile(viewTiles: Tiling.Tile[]): void {
    // Check player on effect tile
    const playerWorld = {
      x: state.player.world.x,
      y: state.player.world.y
    };
    const playerTile = Tiling.getTileAtWorldPos(state.tilemap, playerWorld);

    if (playerTile.effect == Tiling.TileEffect.Hurt){
      state.player.hurt(1);
    } else if (playerTile.effect == Tiling.TileEffect.Teleport){
      console.log('telepuerto');
    }

    if (playerTile.effect == Tiling.TileEffect.Transition){
      if (!state.justTransitioned){
        const tileIdx = state.tilemap.posToIndex(playerTile.pos);
        const transitionTile = state.tilemap.transitionTiles.find((tile: any) => tile.idx == tileIdx);
        transitionMap(transitionTile.mapId);
      }
    } else {
      state.justTransitioned = false;
    }
    
    if (state.player.indoors){
      if (playerTile.effect != Tiling.TileEffect.Door && playerTile.effect != Tiling.TileEffect.Roof){
        state.tilemap.clearHiddenTiles(); // @TODO: Clear hidden tiles for a specific layer? (Currently all layers)
        state.player.indoors = false;
      }
    } else {
      if (playerTile.effect == Tiling.TileEffect.Door){
        const roofTiles = viewTiles.filter((val: any) => val.effect == Tiling.TileEffect.Roof);
        state.tilemap.pushHiddenTiles(playerTile.topLayerIdx, roofTiles);
        state.player.indoors = true;
      }
    }
  }

  // Returns an iterable list containing the player and any NPCs.
  function allEntities(): any[] {
    let entities = [];

    entities.push(state.player);
    for (let npc of state.npcs){
      entities.push(npc);
    }

    return entities;
  }

  export function onKeyDown(keycode: string): void {
    state.keyboardState = 'keydown';
    state.keycode = keycode;
  }

  export function onKeyUp(keycode: string): void {
    state.keyboardState = 'keyup';
    state.keycode = keycode;
  }

  function transitionMap(mapId: string){
    const map = Assets.store.maps[mapId];
    
    state.tilemap = new Tiling.Tilemap(map.tilemap, state.config.tileSize);
    
    // Get the ID of the map you've just transitioned from
    // Get the transitionData for the map that is to be transitioned to
    // Find the item in the transitionTiles whose mapId matches the map you've just transitioned from
    let item = map.tilemap.transitionTiles.find((td: any) => td.mapId === state.mapId)
    // That is where the player will spawn
    // Get the world pos for the tile index where the player will spawn
    // Finally, set as playerWorld
    let tileIdx = item.idx;
    let tilePos = state.tilemap.indexToPos(tileIdx);
    let worldPos = Tiling.tilePosToWorldPos(state.tilemap, tilePos);
    const playerWorld = worldPos;

    // Recreate game objects (camera, player, enemies)
    const playerArchetypeId = 'player';
    // Copy the entities from map
    const playerIdx = map.entities.findIndex((entity: any) => entity.archetypeId === playerArchetypeId);
    let playerSheet = Assets.store.spritesheets[playerArchetypeId];
    let playerMap = Object.assign({}, map.entities[playerIdx]);

    state.camera = new Camera(state.resolution, state.tilemap.resolution, playerWorld);

    // Override the player's spawn position in the map
    playerMap.spawnPos = playerWorld;
    state.player = new Entities.Player(state.camera, playerMap, playerSheet);

    // Remove player from the list of map entities
    //mapEntities.splice(playerIdx, 1);

    state.npcs = [];
    for (let rawEntity of map.entities){
      if (rawEntity.archetypeId !== 'player'){
        let npc = new Entities.Npc(state.camera, rawEntity, Assets.store.spritesheets[rawEntity.archetypeId]);
        state.npcs.push(npc);
      }
    }

    state.prevMapId = state.mapId;
    state.mapId = mapId;

    state.justTransitioned = true;
  }

  function render(){
    Rendering.setDrawColor('black');
    Rendering.fillRect(new Rect({ x: 0, y: 0, w: state.resolution.x, h: state.resolution.y }));
    
    Tiling.renderTilemap(state.tilemap, state.camera, state.frameCount);

    const texture = Assets.store.textures[state.player.archetypeId];
    Rendering.renderSprite(texture, state.player);

    for (let entity of state.npcs){
      const texture = Assets.store.textures[entity.archetypeId];
      Rendering.renderSprite(texture, entity);
    }
  
    renderTimeOfDayOverlay();
    //renderCollisionMesh();


    Rendering.setDrawColor('yellow');
    Rendering.renderText(state.timeOfDay.toString(), 48, { x: 1180, y: 40 });
  }
  
  function renderTimeOfDayOverlay(): void {
    let opacity = 0.1;
    let color = '';

    // @TODO: Move to enum?
    const SUNRISE = 3;
    const DAYBREAK = 9;
    const SUNSET = 18;
    const NIGHTBREAK = 22;

    const mins = state.timeOfDay.minutes;
    const morning = (mins >= SUNRISE && mins < DAYBREAK);
    const daytime = (mins >= DAYBREAK && mins < SUNSET);
    const evening = (mins >= SUNSET && mins < NIGHTBREAK);

    if (daytime){
      return;
    } else if (morning){
      color = '#050000';
      opacity = ((DAYBREAK - mins) * 0.05);
    } else if (evening){
      color = '#000044';
      opacity = ((mins - SUNSET) * 0.1) + 0.1;
    } else {
      color = '#000022';
      opacity = 0.6;
    }

    const mapRect = new Rect({ 
      x: state.camera.view.x, 
      y: state.camera.view.y, 
      w: state.tilemap.resolution.x,
      h: state.tilemap.resolution.y 
    });
    Rendering.setDrawColor(color);
    Rendering.fillRect(mapRect, opacity);
  }

  function renderCollisionMesh(){
    const viewCenter = state.camera.view.centerRelative();

    Rendering.setDrawColor('red');
    Rendering.renderLine({ x: 0, y: viewCenter.y }, { x: state.resolution.x, y: viewCenter.y });
    Rendering.renderLine({ x: viewCenter.x, y: 0}, { x: viewCenter.x, y: state.resolution.y});

    for (let entity of allEntities()){
      Rendering.strokeRect(entity.view);

      const view = worldToView(state.camera, entity.attackBox);
      entity.attackBox.x = view.x;
      entity.attackBox.y = view.y;
      Rendering.fillRect(entity.attackBox, 0.4);
    }

    Rendering.strokeRect(worldToView(state.camera, state.player.area));
  }

  function posToIndex(pos: Vector, dims: Vector): number{
    return (pos.y * dims.x) + pos.x;
  }
}
