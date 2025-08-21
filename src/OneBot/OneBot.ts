import { OneBotListener } from "@sosraciel-lamda/onebot11-protoclient";
import { BaseCommInterface, ListenToolBase, SendMessageArg, SendTool, SendVoiceArg } from "../ChatPlantformInterface";
import { OneBotServiceData, SubtypeDefine, SubtypeDefineTable } from "./Interface";
import { SLogger, UtilCodec } from "@zwa73/utils";


const ListenerPool:Record<string,OneBotListener> = {};

const prefixList = Object.values(SubtypeDefineTable).map(v=>v.flag);
const unwarpRegex = new RegExp(`(${prefixList.join('|')})\\.(user|group)\\.(\\d+)`);
const unwarpId = (text?:string)=>{
    if(text==null) return undefined;
    const unwarped = unwarpRegex.exec(text)?.[3];
    if(unwarped!=undefined) return unwarped;
    SLogger.warn(`OneBotApi unwarpId 获取了一个不合规的id, 已返回原值\ntext: ${text}`);
    return text;
}


/**处理接受的文本
 * @param msg
 */
function getTrans(msg: string) {
    //替换kook标志
    msg = msg.replace(/\(([^\s\\]+)\).+?\(\1\)/g, "");
    //替换所有cq码
    msg = msg.replace(/\[CQ:.*?\][ ]*/g, "");
    //替换换行符
    msg = msg.replace(/\\+n/g, "\n");
    //kook转义
    msg = msg.replace(/\\([\(\)\*])/g, "$1");
    msg = msg.replace(/\\\\/g, "\\");
    //替换html实体
    msg = UtilCodec.decodeHtmlEntities(msg);
    return msg;
}

export class OneBotApi extends ListenToolBase implements BaseCommInterface{
    ast:SendTool;
    charname: string;
    sub:SubtypeDefine;
    constructor(public data:OneBotServiceData) {
        super();
        const {listen_port,send_port,subtype,charname} = data;
        this.charname = charname;
        this.sub = SubtypeDefineTable[subtype];
        this.ast = this.sub.astCtor(send_port);
        if(ListenerPool[listen_port]==null)
            ListenerPool[listen_port] = new OneBotListener(listen_port);

        const listtener = ListenerPool[listen_port];
        //设置监听
        listtener.registerEvent("GroupMessage",{handler:gdata=>{
            const {message,user_id,group_id,self_id} = gdata;
            if(typeof message != "string"){
                SLogger.warn("OneBotApi GroupMessage 消息类型错误",message);
                return;
            }

            // 跳过其他目标
            if (`${self_id}` != data.self_id) return;
            // 判断被at
            const qqatme = message.includes(`[CQ:at,qq=${self_id}`);
            const rolme = message.indexOf(`(rol)${self_id}(rol)`) > -1;
            const atme = rolme || qqatme || data.without_at;
            if (!atme) return;
            if (message.includes("CQ") || message.includes("cq") || message.length < 2)
                return;

            //处理消息
            const fixedMsg = getTrans(message);
            SLogger.info(
                `OneBotApi ${self_id} 接收 GroupMessage:\n` +
                `message: ${message}\n` +
                `fixedMsg: ${fixedMsg}\n` +
                `user_id: ${user_id}\n` +
                `group_id: ${group_id}`
            );

            const fixedUserId  = `${this.sub.flag}.user.${user_id}`;
            const fixedGroupId = `${this.sub.flag}.group.${group_id}`;
            this.invokeEvent('message',{
                content   : fixedMsg,
                userId    : fixedUserId,
                channelId : fixedGroupId,
                sourceSet : [this.sub.flag,fixedGroupId,fixedUserId]
            });
        }});
        listtener.registerEvent("PrivateMessage",{handler:pdata=>{
            const {message,user_id,self_id} = pdata;
            if(typeof message != "string"){
                SLogger.warn("OneBotApi PrivateMessage 消息类型错误",message);
                return;
            }

            // 跳过其他目标
            if (`${self_id}` != data.self_id) return;
            if (message.includes("CQ") || message.includes("cq") || message.length < 2)
                return;

            //处理消息
            const fixedMsg = getTrans(message);
            SLogger.info(`OneBotApi ${self_id} 接收 PrivateMessage:\n` +
                `message: ${message}\n` +
                `fixedMsg: ${fixedMsg}\n` +
                `user_id: ${user_id}`
            );

            const fixedUserId = `${this.sub.flag}.user.${user_id}`;
            this.invokeEvent('message',{
                content   : fixedMsg,
                userId    : fixedUserId,
                channelId : fixedUserId,
                sourceSet : [this.sub.flag,fixedUserId],
            });
        }});
    }
    sendMessage(arg: SendMessageArg){
        return this.ast.sendMessage({...arg,
            userId    : unwarpId(arg.userId)!,
            channelId : unwarpId(arg.channelId)!
        });
    }
    sendVoice(arg:SendVoiceArg){
        return this.ast.sendVoice({...arg,
            userId    : unwarpId(arg.userId)!,
            channelId : unwarpId(arg.channelId)!
        });
    }
    getData(){
        return this.data;
    }
}