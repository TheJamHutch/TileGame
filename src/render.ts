import { Vector, Rect } from './primitives';

export namespace Render {

  export enum RenderMode{
    STROKE, FILL
  };
  
  export type Bitmap = {
    dimensions: Vector,
    image: HTMLImageElement
  };
  
  // @TODO: This will only work when running locally. Images for Bitmaps need to be obtained from server.
  export function loadBitmap(path: string): Bitmap {
    const image = new Image();
    image.src = path;
  
    return {
      dimensions: { x: image.width, y: image.height },
      image
    };
  }
  
  export function drawLine(context: CanvasRenderingContext2D, start: Vector, end: Vector){
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  
  export function drawRect(context: CanvasRenderingContext2D, rect: Rect, mode: RenderMode = RenderMode.STROKE){
    if (mode === RenderMode.STROKE){
      context.strokeRect(rect.x, rect.y, rect.w, rect.h);
    } else if (mode === RenderMode.FILL){
      context.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
  }
  
  export function drawBitmap(context: CanvasRenderingContext2D, bitmap: Bitmap, src: Rect, dst: Rect){
    context.drawImage(bitmap.image, 
      src.x, src.y, src.w, src.h,
      dst.x, dst.y, dst.w, dst.h);
  }

}
