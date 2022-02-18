import './style.scss'
import * as jquery from 'jquery';
import { App } from './src/app';

window.$ = window.jquery = jquery;
let dom = {};

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

  // @TODO: This should not be where the resolution is set.
  // Set canvas resolution
  dom.canvas.width = 640;
  dom.canvas.height = 480;

  // Init context
  const context = dom.canvas.getContext('2d');
  context.font = '16px consolas';
  context.fillStyle = 'black';

  const app = new App();

  // Bind app events to the corresponding DOM event or element.
  dom.controls.mapSelect.on('change', (e) => {
    app.listeners.onMapSelect(e.target.value);
  });
  $(document).on('keydown', (e) => {
    app.listeners.onKeyDown(e.key);
  });
  $(document).on('keyup', (e) => {
    app.listeners.onKeyUp(e.key);
  });
  
  app.start(context);
});
