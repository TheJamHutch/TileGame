export function Events(){
  let listeners = {} as any;
  let queue = [] as any[];

  function raise(id: string, context: any){
    if (listeners[id]){
      queue.push({ id, context });
    }
  }
  
  function register(id: string, callback: (context: any) => void){
    if (!listeners[id]){
      listeners[id] = {}
      listeners[id].callbacks = [];
    }

    listeners[id].callbacks.push(callback);
  }

  function poll(){
    if (queue.length > 0){
      let item = queue.shift();
      for(let fn of listeners[item.id].callbacks){
        fn(item.context);
      }
    }
  }

  return {
    raise,
    register,
    poll
  }
}
