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

  get left(): number {
    return this.x;
  }

  get top(): number {
    return this.y;
  }

  get right(): number {
    return this.x + this.w;
  }

  get bottom(): number {
    return this.y + this.h;
  }

  constructor(params: {x: number, y: number, w: number, h: number})
  {
    this.x = params.x;
    this.y = params.y;
    this.w = params.w;
    this.h = params.h;
  }

  // Returns a vector representing the center point of the Rect in absolute space
  centerAbsolute(): Vector {
    return {
      x: this.x + (this.w / 2),
      y: this.y + (this.h / 2)
    }
  }

  centerRelative(): Vector {
    return {
      x: (this.w / 2),
      y: (this.h / 2)
    }
  }

};
