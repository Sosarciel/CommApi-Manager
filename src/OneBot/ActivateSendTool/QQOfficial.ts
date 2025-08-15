import { UtilFunc, match } from "@zwa73/utils";
import { OneBotSender, CQCodeTool } from "@sosraciel-lamda/onebot11-proto-client";
import { FfmpegTool } from "@zwa73/audio-utils";
import { chkType } from "./Utils";
import { SendMessageArg, SendVoiceArg, SendTool } from "@/src/ChatPlantformInterface";
import { AudioCache, InjectTool } from "@/src/Utils";



export const QQOfficialActiveSendToolCtor = (port:number):SendTool=>{
    const sender = new OneBotSender('127.0.0.1', port);
    return {
        async sendMessage(params:SendMessageArg): Promise<boolean> {
            const { channelId, message } = params;

            const notCQ = true;
            const nChannelId = parseInt(channelId);
            await match(chkType(params),{
                "group_message":async ()=>{
                    if (notCQ != true)
                        return void sender.sendGroupMsg(nChannelId, message, notCQ);

                    let firstClip = true;
                    const pdelay = message.length * 100;
                    const rdelay = parseInt((Math.random() * pdelay) as any);
                    if (firstClip) {
                        firstClip = false;
                        await UtilFunc.sleep(500 + rdelay);
                    } else await UtilFunc.sleep(1000 + pdelay + rdelay);
                    void sender.sendGroupMsg(nChannelId, message, notCQ);
                    await UtilFunc.sleep(1000 + parseInt((Math.random() * 500) as any));
                },
                "private_message":async ()=>{
                    if (notCQ != true)
                        return void sender.sendPrivateMsg(nChannelId, message, notCQ);

                    let firstClip = true;
                    const pdelay = message.length * 20;
                    const rdelay = parseInt((Math.random() * pdelay) as any);
                    if (firstClip) {
                        firstClip = false;
                        await UtilFunc.sleep(500 + rdelay);
                    } else await UtilFunc.sleep(1000 + pdelay + rdelay);
                    void sender.sendPrivateMsg(nChannelId, message, notCQ);
                    await UtilFunc.sleep(1000 + parseInt((Math.random() * 500) as any));
                },
            })
            return true;
        },

        async sendVoice(params:SendVoiceArg): Promise<boolean> {
            const { channelId, voiceFilePath } = params;

            const notCQ = false;
            const nChannelId = parseInt(channelId);
            const mp3 = await AudioCache.transcode2mp3(voiceFilePath);
            const voiceCQ = CQCodeTool.fileRecord(mp3);
            await match(chkType(params),{
                "group_message":async ()=>{
                    await UtilFunc.sleep(1000);
                    void sender.sendGroupMsg(nChannelId, voiceCQ, notCQ);
                },
                "private_message":async ()=>{
                    await UtilFunc.sleep(1000);
                    void sender.sendPrivateMsg(nChannelId, voiceCQ, notCQ);
                },
            });
            return true;
        }
    }
}