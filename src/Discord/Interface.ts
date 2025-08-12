import { LogLevel } from "@zwa73/utils";
import { ListenTool } from "../ChatPlantformInterface";

/**Discord初始化选项 */
export type DiscordServiceData = {
    /**绑定角色名 */
    charname:string;
    /**登录token*/
    token:string;
    /**正向代理链接 */
    proxy_url?:string;
}



export type DiscordUserId  = `discord.user.${string}`;
export type DiscordGroupId = `discord.group.${string}`;



export type DiscordWorkerServerInterface = {
    log(level:LogLevel,message:string):void;
    invokeEvent:ListenTool['invokeEvent'];
};