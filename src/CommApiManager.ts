import { ServiceConfig, ServiceManager, ServiceManagerBaseConfig } from "@zwa73/service-manager";
import { TelegramOption, TelegramApi } from "./Telegram";
import { BaseCommInterface } from "./ChatPlantformInterface";
import { DiscordApi, DiscordOption } from "./Discord";
import { throwError } from "@zwa73/utils";
import { AudioCache, InjectData, InjectTool } from "./Utils";
import { OneBotApi } from "./OneBot/OneBot";
import { OneBotOption } from "./OneBot/Interface";


const CtorTable = {
    Telegram: (table:TelegramOption) => new TelegramApi(table),
    Discord : (table:DiscordOption)  => new DiscordApi (table),
    OneBot  : (table:OneBotOption)   => new OneBotApi (table),
};
type CtorTable = typeof CtorTable;

type CommApiManagerJsonTable = ServiceManagerBaseConfig & {
    instance_table: {
        [key: string]: ServiceConfig<CtorTable>;
    };
};



/**通讯接口管理器 */
type _CommApiManager = ServiceManager<CtorTable,BaseCommInterface>;

type CommApiManagerOption = {
    /**配置文件路径 */
    tablePath   :string;
    /**缓存文件夹目录
     * 将会存入一些音频缓存
     */
    cacheDir    :string;
    /**需要注入的函数 */
    inject      :InjectData;
}

/**语言模型管理器 需先调用init */
export type CommApiManager = _CommApiManager&{init:(opt:CommApiManagerOption)=>void};
export const CommApiManager = new Proxy({} as {ins?:_CommApiManager}, {
    get(target, prop, receiver) {
        if (prop === 'init') {
            return (opt:CommApiManagerOption) => {
                if (target.ins==null){
                    AudioCache.CACHE_PATH = opt.cacheDir;
                    InjectTool.inject(opt.inject);
                    target.ins = ServiceManager.from<CtorTable,BaseCommInterface>({
                        cfgPath:opt.tablePath,
                        ctorTable:CtorTable,
                    });
                }
            };
        }
        if (target.ins==null) throwError("LaMManager 未初始化", 'error');
        return Reflect.get(target.ins, prop, receiver);
    }
}) as any as CommApiManager;


//void (async()=>{
//    const ts = await CommApiManager.getServiceFromType('Telegram');
//    ts.forEach(t=>t.instance.)
//    const vs = await CommApiManager.getVaildService((t)=>true);
//    vs.forEach(t=>t.)
//})();

