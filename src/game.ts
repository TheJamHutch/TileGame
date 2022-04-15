import { Rect, Vector } from './primitives';
import { Tiling } from './tilemap';
import { Camera, worldToView } from './camera'; 
import { Entities } from './entities';
import { Rendering } from './rendering';
import { Enemy, initEnemy, updateEnemy } from './enemy';
import { Sprite, animateSprite } from './sprites';
import { Gui } from './gui';
import { Assets } from './assets';
import * as _ from 'lodash';

export namespace Game{
  export let keyDown: string;

  // @TODO: Dont export
  export const state = {} as any;

  export function init(config: any){
    state.resolution = config.resolution;
    state.frameCount = 0;
    
    const initMap = Assets.store.maps[config.initMapId];
    
    state.tilemap = new Tiling.Tilemap(initMap.tilemap);

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
          for (let npc of state.npcs){
            let entityWorld = new Rect({ x: npc.world.x, y: npc.world.y, w: npc.view.w, h: npc.view.h });
            if (Entities.checkCollision(state.player.attackBox, entityWorld)){
              npc.hurt(10);
            }
          }
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
      const worldRect = new Rect({
        x: entity.world.x,
        y: entity.world.y,
        w: entity.view.w,
        h: entity.view.h
      });
      collisionBoxes.push(worldRect);
    }

    
    state.camera.update(state.player, state.tilemap.resolution);

    state.player.update(state.tilemap.resolution, collisionBoxes);

    const playerWorld = {
      x: state.player.world.x + (state.player.view.w / 2),
      y: state.player.world.y + (state.player.view.h / 2)
    };
    const playerTile = Tiling.getTileAtWorldPos(state.tilemap, playerWorld);
    
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
        state.tilemap.clearHiddenTiles(1); // @TODO: Hardcoded tile layer index
        state.player.indoors = false;
      }
    } else {
      if (playerTile.effect == Tiling.TileEffect.Door){
        const roofTiles = viewTiles.filter((val: any) => val.effect == Tiling.TileEffect.Roof);
        state.tilemap.pushHiddenTiles(1, roofTiles); // @TODO: Hardcoded tile layer index
        state.player.indoors = true;
      }
    }

    // Update all NPCS
    for (let npc of state.npcs){
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
      const anim = sheet.animations[entity.animationId] as any;
      animateSprite(entity, anim, state.frameCount);
    }

    render();
  
    state.frameCount++;
    if (state.frameCount > 1000){
      state.frameCount = 0;
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
    
    state.tilemap = new Tiling.Tilemap(map.tilemap);
    
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
    let playerSheet = Assets.store.spritesheets['player'];
    let playerMap = map.entities.player;
    state.camera = new Camera(state.resolution, state.tilemap.resolution, playerWorld);
    state.player = new Entities.Player(state.camera, playerMap, playerSheet);

    state.prevMapId = state.mapId;
    state.mapId = mapId;

    // @TODO: Find another way
    state.justTransitioned = true;
  }

  function render(){
    Rendering.setDrawColor('black');
    Rendering.fillRect(new Rect({ x: 0, y: 0, w: state.resolution.x, h: state.resolution.y }));
    
    Tiling.renderTilemap(state.tilemap, state.camera);

    const texture = Assets.store.textures[state.player.archetypeId];
    Rendering.renderSprite(texture, state.player);

    for (let entity of state.npcs){
      const texture = Assets.store.textures[entity.archetypeId];
      Rendering.renderSprite(texture, entity);
    }
  
    //renderCollisionMesh();
  }

  function renderCollisionMesh(){
    const viewCenter = {
      x: state.resolution.x / 2,
      y: state.resolution.y / 2
    };

    Rendering.setDrawColor('red');
    Rendering.renderLine({ x: 0, y: viewCenter.y }, { x: state.resolution.x, y: viewCenter.y });
    Rendering.renderLine({ x: viewCenter.x, y: 0}, { x: viewCenter.x, y: state.resolution.y});

    for (let entity of allEntities()){
      Rendering.strokeRect(entity.view);
    }

    const atkBox = state.player.attackBox;
    const view = worldToView(state.camera, atkBox);
    atkBox.x = view.x;
    atkBox.y = view.y;
    Rendering.fillRect(atkBox, 0.4);
  }

  function posToIndex(pos: Vector, dims: Vector): number{
    return (pos.y * dims.x) + pos.x;
  }
}
