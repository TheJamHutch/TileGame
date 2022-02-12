import './style.scss'
import * as jquery from 'jquery';

import { Game } from './src/game';

window.$ = window.jquery = jquery;

let dom = {};

function mainLoop(game){

  function update(game){

    // Update debug view
    dom.debug.cameraPos.innerHTML = `Camera: ( x: ${game.cameraPos.x}, y: ${game.cameraPos.y} )`;
    dom.debug.playerPos.innerHTML = `Player: ( x: ${game.playerPos.x}, y: ${game.playerPos.y} )`;

    game.update();
    
    requestAnimationFrame(() => {
      update(game);
    });
  }

  update(game);
}

$(document).on('DOMContentLoaded', () => {
  // Init DOM object
  dom.canvas = $('canvas')[0];
  dom.controls = {
    resolutionSelect: $('#controls-res'),
    mapSelect: $('#controls-map')
  };
  dom.debug = {
    cameraPos: $('#camera-pos')[0],
    playerPos: $('#player-pos')[0]
  };

  // Init game config
  let config = {
    resolution: { x: 640, y: 480 },
    initMap: 'overworld'
  };

  // Set canvas resolution
  dom.canvas.width = config.resolution.x;
  dom.canvas.height = config.resolution.y;

  // Init context
  const context = dom.canvas.getContext('2d');
  context.font = '16px consolas';
  context.fillStyle = 'black';

  const game = new Game(config, context);
  game.start();

  // Init events
  dom.controls.mapSelect.on('change', (e) => {
    game.changeMap(e.target.value);
  })
  $(document).on('keydown', (e) => {
    game.onKeyDown(e.key);
  });
  $(document).on('keyup', (e) => {
    game.onKeyUp(e.key);
  });

  mainLoop(game);
});
