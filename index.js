import './style.scss'
import * as jquery from 'jquery';
import { App } from './src/app';

window.$ = window.jquery = jquery;

$(document).on('DOMContentLoaded', () => {

  const canvas = $('canvas')[0];

  // @TODO: This should not be where the resolution is set.
  // Set canvas resolution
  canvas.width = 640;
  canvas.height = 480;

  // Init context
  const context = canvas.getContext('2d');
  context.font = '16px consolas';
  context.fillStyle = 'black';

  const app = new App();

  // Bind app events to the corresponding DOM event or element.
  $(document).on('keydown', (e) => {
    app.listeners.onKeyDown(e.key);
  });
  $(document).on('keyup', (e) => {
    app.listeners.onKeyUp(e.key);
  });
  
  app.start(context);
});
