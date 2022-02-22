// @TODO: Make this a class?
export type Vector = {
  x: number,
  y: number
};

export class Rect
{
  x: number;
  y: number;
  w: number;
  h: number;

  get left()
  {
    return this.x;
  }

  get top()
  {
    return this.y;
  }

  get right()
  {
    return this.x + this.w;
  }

  get bottom()
  {
    return this.y + this.h;
  }

  constructor(params: {x: number, y: number, w: number, h: number})
  {
    this.x = params.x;
    this.y = params.y;
    this.w = params.w;
    this.h = params.h;
  }

};
