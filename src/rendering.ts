import { Assets } from './assets';
import { Vector, Rect } from './primitives';
import { Sprite } from './sprites';

export namespace Rendering{

  export type Bitmap = {
    dimensions: Vector,
    image: HTMLImageElement
  };

  let state = {
    context: null,
    resolution: { x: 0, y: 0 }
  } as any;
  
  export function init(context: CanvasRenderingContext2D, resolution: Vector){
    state.context = context;
    state.resolution = resolution;
  }

  export function createBitmap(path: string): Bitmap {
    const image = new Image();
    image.src = path;
    
    return {
      dimensions: { x: image.width, y: image.height },
      image
    };
  }

  export function setDrawColor(colorId: string){
    state.context.fillStyle = colorId;
    state.context.strokeStyle = colorId;
  }

  export function renderPixel(pos: Vector){
    state.context.fillRect(pos.x, pos.y, 1, 1);
  }

  export function renderLine(start: Vector, end: Vector){
    state.context.beginPath();
    state.context.moveTo(start.x, start.y);
    state.context.lineTo(end.x, end.y);
    state.context.stroke();
  }
  
  export function fillRect(rect: Rect, opacity?: number){
    // @TODO: Check opacity is in range
    if (opacity){
      state.context.globalAlpha = opacity;
    }

    state.context.fillRect(rect.x, rect.y, rect.w, rect.h);

    state.context.globalAlpha = 1.0;
  }

  export function strokeRect(rect: Rect){
    state.context.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  export function renderBitmap(bitmap: Bitmap, src: Rect, dst: Rect){
    state.context.drawImage(
      bitmap.image,
      src.x, src.y, src.w, src.h,
      dst.x, dst.y, dst.w, dst.h)
  }
  
  export function renderText(text: string, pos: Vector){
    state.context.font = '24px myfont';
    state.context.fillText(text, pos.x, pos.y);
  }

  export function renderSprite(texture: Assets.Texture, sprite: Sprite){
    renderBitmap(texture.bitmap, sprite.clip, sprite.view);
  }
}
