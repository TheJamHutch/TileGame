import { Events } from "./events";
import { Game } from "./game";
import { global } from "./global";

// @TODO: Combine this class with index.js and have that be the main app scrpt ???

export class App{
  events: any;
  game: Game;
  listeners = {} as any;

  start(context: CanvasRenderingContext2D){
    // @TODO: Move some stuff to the constructor???

    // @TODO: Must init events first
    this.events = Events();
    global.eventsRef = this.events;
    
    // @TODO: Don't hardcode the config
    const config = {
      resolution: { x: 640, y: 480 },
      initMap: 'overworld'
    };
    this.game = new Game(config, context);

    // Init event listeners
    this.listeners.onMapSelect = ((id: string) => this.events.raise('mapChange', id));
    this.listeners.onKeyDown = ((key: string) => this.game.onKeyDown(key));
    this.listeners.onKeyUp = ((key: string) => this.game.onKeyUp(key));
    
    this.mainLoop();
  }

  private mainLoop(){
    function update(self: any){
  
      self.game.update();
      
      requestAnimationFrame(() => {
        update(self);
      });
    }
  
    update(this);
  }
}
