import { ServiceInterface } from "@zwa73/service-manager";
import { EventSystem } from "@zwa73/utils";


export type SendBaseArg = {
    /**组id */
    groupId?: string;
    /**用户id */
    userId: string;
    /**发言者id */
    senderId: string;
}

export type SendMessageArg = SendBaseArg&{
    /**消息 */
    message: string;
}

export type SendVoiceArg =  SendBaseArg&{
    /**音频文件路径 */
    voiceFilePath: string;
}

/**发信工具 */
export type SendTool = {
    /**发送文本
     * @param arg  - 发送文本参数
     * @returns 是否成功发送
     */
    sendMessage: (arg:SendMessageArg) => Promise<boolean>;
    /**发送音频
     * @param arg  - 发送音频参数
     * @returns 是否成功发送
     */
    sendVoice: (arg:SendVoiceArg) => Promise<boolean>;
}


/**基础监听器事件表 */
export type ListenerEventTable ={
    /**文本消息事件 */
    message:(data:{
        content:string,
        userId:string,
        groupId?:string,
    })=>void;
}

/**监听工具 */
export type ListenTool = EventSystem<ListenerEventTable>;
export const ListenToolBase = class extends EventSystem<ListenerEventTable>{isRuning(){return true;}};

/**基础接口数据 */
export type BaseData = {
    /**实例所绑定的角色名 */
    charname:string;
}


/**基础通讯工具 */
export type BaseCommInterface = ServiceInterface<ListenTool&SendTool&BaseData>;