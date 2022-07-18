import { Vector, Rect } from "./primitives";
import { Rendering } from "./rendering";

export namespace Gui{
  const state = {
    view: new Rect({ x: 0, y: 420, w: 800, h: 180 }),
    dialogShown: false,
    pages: [] as Array<Array<string>>, // string[][] ?,
    pageIdx: 0,

    mapShown: false,
    mapView: new Rect({ x: 100, y: 100, w: 600, h: 400 }),
  };
 
  export function showDialogBox(text: string): void {
    state.dialogShown = true;

    const MAX_LINE_WIDTH = 100;
    // Break text into individual words.
    let words = text.split(' ');
    // Join words together into lines of sufficient width.
    let lines = [];
    let lineText = '';
    for (let word of words){
      lineText += word + ' ';
      if (lineText.length + word.length > MAX_LINE_WIDTH){
        lines.push(lineText);
        lineText = '';
      }
    }

    let lineIdx = 0;
    let linesPerPage = 6;
    let page = [];
    for (let line of lines){
      page.push(line);
      lineIdx++;

      if (lineIdx % linesPerPage === 0){
        state.pages.push(page);
        page = [];
      }
    }
  }

  export function hideDialogBox(): void {
    state.dialogShown = false;
  }

  export function nextPage(): void {
    state.pageIdx++;
  }

  export function toggleMap(): void {
    state.mapShown = !state.mapShown;
  }

  export function render(): void {
    if (state.dialogShown){  
      Rendering.setDrawColor('darkred');
      Rendering.fillRect(state.view);
      Rendering.setDrawColor('gold');
      Rendering.strokeRect(state.view);

      
      
      
      
      Rendering.setDrawColor('white');
      let page = state.pages[state.pageIdx];
      let y = 0;
      for (let line of page){
        Rendering.renderText(line, { x: state.view.x + 20, y: state.view.y + 30 + y });
        y += 22;
      }
    }

    if (state.mapShown){
      Rendering.setDrawColor('wheat');
      Rendering.fillRect(state.mapView);
    }
  }
}