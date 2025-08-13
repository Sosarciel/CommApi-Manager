import { ServiceConfig, ServiceManager, ServiceManagerBaseConfig } from "@zwa73/service-manager";
import { TelegramServiceData, TelegramApi } from "./Telegram";
import { BaseCommInterface } from "./ChatPlantformInterface";
import { DiscordApi, DiscordServiceData } from "./Discord";
import { SLogger, throwError, UtilFunc } from "@zwa73/utils";
import { AudioCache, InjectData, InjectTool } from "./Utils";
import { OneBotApi, OneBotServiceData } from "./OneBot";


const CtorTable = {
    Telegram: (table:TelegramServiceData) => new TelegramApi(table),
    Discord : (table:DiscordServiceData)  => new DiscordApi (table),
    OneBot  : (table:OneBotServiceData)   => new OneBotApi  (table),
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
export const CommApiManager = UtilFunc.createInjectable({
    initInject(opt:CommApiManagerOption):_CommApiManager{
        AudioCache.CACHE_PATH = opt.cacheDir;
        InjectTool.inject(opt.inject);
        const mgr = ServiceManager.from({
                cfgPath:opt.tablePath,
                ctorTable:CtorTable,
        });
        return mgr;
    }
} as const);
export type CommApiManager = typeof CommApiManager;
//void (async()=>{
//    const ts = await CommApiManager.getServiceFromType('Telegram');
//    ts.forEach(t=>t.instance.)
//    const vs = await CommApiManager.getVaildService((t)=>true);
//    vs.forEach(t=>t.)
//})();

