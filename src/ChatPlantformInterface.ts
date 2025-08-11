import { ServiceInterface } from "@zwa73/service-manager";





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


/**基础监听器事件 */
export type ListenerEvent<T extends keyof ListenerEventTable> = {
    /**事件类型 */
    eventType:T
    /**权重 */
    weight:number;
    /**事件ID */
    id:string;
    /**事件函数 */
    event:ListenerEventTable[T];
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
/**监听器事件数据表 */
export type ListenerEventDataTable = {
    [K in keyof ListenerEventTable]:Parameters<ListenerEventTable[K]>[0]
}
/**监听器事件类型表 */
export type ListenerEventType = keyof ListenerEventTable;

/**监听工具 */
export type ListenTool = {
    /**注册事件
     * @param event - 事件
     */
    registerEvent<T extends ListenerEventType>(event:ListenerEvent<T>):void;
    /**执行事件
     * @param eventType - 事件类型
     * @param opt       - 事件参数
     * @returns 最好返回显式 undefined 以支持桥
     */
    invokeEvent<T extends ListenerEventType>(eventType:T,opt:ListenerEventDataTable[T]):void;
}


/**基础接口数据 */
export type BaseData = {
    /**实例所绑定的角色名 */
    charname:string;
}


/**基础通讯工具 */
export type BaseCommInterface = ServiceInterface<ListenTool&SendTool&BaseData>;