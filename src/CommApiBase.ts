import { UtilFunc } from "@zwa73/utils";
import { ListenerEvent, ListenerEventDataTable, ListenerEventTable, ListenerEventType, ListenTool } from "./ChatPlantformInterface";


/**基础监听器 */
export class CommApiBase implements ListenTool{
    _table:{
        [K in keyof ListenerEventTable]?:ListenerEvent<K>[]
    } = {};

    registerEvent<T extends ListenerEventType>(event:Pick<ListenerEvent<T>,'event'|'eventType'>&Partial<ListenerEvent<T>>){
        if(this._table[event.eventType]==undefined)
            this._table[event.eventType] = [] as any;

        event.weight ??= 0;
        event.id ??= UtilFunc.genUUID();

        this._table[event.eventType]!.push(event as any);
    }

    invokeEvent<T extends ListenerEventType>(eventType:T,data:ListenerEventDataTable[T]):void{
        const emap = this._table[eventType];
        if(emap===undefined) return undefined;
        Object.values(emap)
            .sort((a,b)=>b.weight-a.weight)
            .forEach((v)=>v.event(data));
    }
    isRuning(){return true;}
}