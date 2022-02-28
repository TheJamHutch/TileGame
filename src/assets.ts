import { Bitmap, loadBitmap } from './render';
import { SpriteSheet } from './sprites';
import * as _ from 'lodash';

import overworldMapJson from '../maps/overworld.json';
import dungeonMapJson from '../maps/dungeon.json';
import townMapJson from '../maps/town.json';
import roomMapJson from '../maps/room.json';
import badMapJson from '../maps/bad.json';

import playerSheetJson from '../sheets/player.json';
import slimeSheetJson from '../sheets/slime.json';

const PATH_TEXTURES = './img/';
const PATH_MAPS = './maps/';
const PATH_SHEETS = './sheets';

export class AssetStore{

  textures: any;
  maps: any;
  sheets: any;

  constructor(){

    // Load textures
    this.textures = {};
    this.textures['tilemap'] = loadBitmap(PATH_TEXTURES + 'basetiles.png');
    this.textures['player'] = loadBitmap(PATH_TEXTURES + 'player.png');
    this.textures['slime'] = loadBitmap(PATH_TEXTURES + 'slime.png');

    // Load maps
    this.maps = {};
    this.maps['overworld'] = overworldMapJson;
    this.maps['dungeon'] = dungeonMapJson;
    this.maps['town'] = townMapJson;
    this.maps['room'] = roomMapJson;
    this.maps['bad'] = badMapJson;

    // Load sheets
    this.sheets = {};
    this.sheets['player'] = new SpriteSheet(playerSheetJson);
    this.sheets['slime'] = new SpriteSheet(slimeSheetJson);
  }
}
