import { AttachmentBuilder, Channel, Client, Events, GatewayIntentBits, Message, Partials } from "discord.js";
import { ProxyAgent } from "undici";
import fs from 'fs';
import { parentPort,workerData } from "worker_threads";
import { Bridge, BridgeInterface } from "@zwa73/utils";
import type { DiscordGroupId, DiscordOption, DiscordUserId, DiscordWorkerServerInterface } from "./Interface";
import type { SendMessageArg, SendTool, SendVoiceArg } from "../ChatPlantformInterface";


/**Discord接口 */
class DiscordWorkerClient implements SendTool{
    charname:string;
    token:string;
    proxyUrl?:string;
    agent?: ProxyAgent;
    UserIdChnnelIdMap:Record<DiscordUserId,string>={};
    client:Client;
    bridge:BridgeInterface<DiscordWorkerServerInterface>;
    constructor(private data:DiscordOption){
        const {charname,token,proxy_url} = data;
        this.charname = charname;
        this.token = token;
        this.proxyUrl = proxy_url;
        if(this.proxyUrl) this.agent = new ProxyAgent(this.proxyUrl);

        this.bridge = Bridge.create<DiscordWorkerServerInterface>(
            this,
            (data)=>parentPort?.postMessage(data),
            (onData)=>parentPort?.on('message',onData),
        );
        const client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [Partials.Channel,Partials.Message],
            rest:{
                agent:this.agent
            }
        });

        client.once(Events.ClientReady, async () => {
            await this.bridge.log('info','DiscordApi 已启动');
        });
        client.on(Events.MessageCreate, async (message: Message) => {
            try{
            await this.bridge.log('http',
                `DiscordApi.onMessage ${this.charname} {\n`+
                `  content:${message.content},\n`   +
                `  userId:${message.author.id},\n`  +
                `  groupId:${message.guildId},\n`   +
                `  channelId:${message.channelId}\n`+
                `}`
            );
            if (message.author.bot) return;
            //console.log(message);
            //await message.reply('pong');
            const channel = message.channel;

            if(!channel.isSendable()) return;

            const userId:DiscordUserId   = `dcu_${message.author.id}`;
            const groupId:DiscordGroupId|undefined = message.guildId ? `dcg_${message.guildId}` : undefined;
            if(message.guildId==null) this.UserIdChnnelIdMap[userId] = message.channelId;
            //跳过非at频道消息
            if(message.guildId!=null && !message.mentions.has(client?.user?.id??'')) return;
            await this.bridge.invokeEvent('message',{
                content:message.content,
                userId,groupId,
            });
            }catch(e){
                await this.bridge.log('warn', `DiscordApi.onMessage 错误 charName:${this.charname} error:${String(e)}`);
            }
        });
        client.login(this.token).catch(async e=>{
            await this.bridge.log('error',`DiscordApi 登录错误 charname:${this.charname} error:${String(e)}`);
        });
        this.client = client;
    }
    async sendMessage(arg: SendMessageArg) {
        const {message,userId,groupId}=arg;
        let channel:Channel|undefined = undefined;
        channel = groupId==null
            ? this.client.channels.cache.get(this.UserIdChnnelIdMap[userId as DiscordUserId])
            : this.client.channels.cache.get(groupId.replace('dcg_',''));
        if(channel?.isSendable()){
            await channel.send(message);
            return true;
        }
        return false;
    }
    async sendVoice(arg: SendVoiceArg){
        const {senderId,userId,voiceFilePath,groupId}=arg;
        const channel = groupId==null
            ? this.client.channels.cache.get(this.UserIdChnnelIdMap[userId as DiscordUserId])
            : this.client.channels.cache.get(groupId.replace('dcg_',''));
        if(channel?.isSendable()){
            //const oggpath = await transcode2opusogg(voiceFilePath,256);
            const audioBuffer = await fs.promises.readFile(voiceFilePath);
            const attr = new AttachmentBuilder(audioBuffer, { name: 'voice.wav' });
            await channel.send({files:[attr]});
            return true;
        }
        return false;
    }
}


if(parentPort){
    const client = new DiscordWorkerClient(workerData);
    // 捕获未处理的异常
    process.on('uncaughtException', async (err) => {
        await client.bridge.log('error', `DiscordWorkerClient 未捕获的异常: ${err.message}\n${err.stack}`);
        process.exit(1); // 退出工作线程
    });

    // 捕获未处理的 Promise 拒绝
    process.on('unhandledRejection', async (reason) => {
        await client.bridge.log('error', `DiscordWorkerClient 未捕获的拒绝: ${String(reason)}`);
        process.exit(1); // 退出工作线程
    });
}