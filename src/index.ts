import '../style.scss'
import jquery from 'jquery';
import { Game } from './game';
import { Assets } from './assets';
import { Rendering } from './rendering';
import { Gui } from './gui';

// @ts-ignore
window.$ = window.jquery = jquery;

let paused = false;
  
function update(){
  if (!paused){
    Game.update();
  }
  Gui.render();

  requestAnimationFrame(() => {
    update();
  });
}

$(async () => {

  // Request init config from server
  const initConfig = {
    resolution: { x: 1280, y: 1024 },
    initMapId: 'empty',
    tileSize: 32
  };

  // Init canvas
  const canvas = document.querySelector<HTMLCanvasElement>('canvas');
  canvas.width = initConfig.resolution.x;
  canvas.height = initConfig.resolution.y;

  // Init context
  const context = canvas.getContext('2d');
  context.font = '16px consolas';
  context.fillStyle = 'black';
  context.imageSmoothingEnabled = false;

  await Assets.loadAll();
  
  Rendering.init(context, initConfig.resolution);
  Game.init(initConfig);

  // Bind app events to the corresponding DOM event or element.
  $(document).on('keydown', (e) => {
    if (e.code === 'KeyP'){
      console.log('paused');
    } else {
      Game.onKeyDown(e.code);
    }
  });
  $(document).on('keyup', (e) => {
    Game.onKeyUp(e.code);
  });
  
  update();
});
