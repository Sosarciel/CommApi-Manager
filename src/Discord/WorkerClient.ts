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
    /**discord私聊会创建临时频道, 但不自动缓存临时频道Id  
     * 该映射记录了 userId -> channelId  
     */
    UserIdChnnelIdMap:Record<string,string>={};
    GroupIdChnnelIdMap:Record<string,string>={};
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

            const userId = message.author.id;
            const groupId = message.guildId;
            const fixedUserId :DiscordUserId   = `discord.user.${userId}`;
            const fixedGroupId:DiscordGroupId|undefined = message.guildId
                ? `discord.group.${groupId}` : undefined;

            //缓存频道Id
            if(groupId==null)
                this.UserIdChnnelIdMap[userId] = message.channelId;
            else this.GroupIdChnnelIdMap[groupId] = message.channelId;

            //跳过非at频道消息
            if(message.guildId!=null && !message.mentions.has(client?.user?.id??'')) return;
            await this.bridge.invokeEvent('message',{
                content: message.content,
                userId : fixedUserId,
                groupId: fixedGroupId,
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
            ? this.client.channels.cache.get(this.UserIdChnnelIdMap[userId])
            : this.client.channels.cache.get(this.GroupIdChnnelIdMap[groupId]);
        if(channel?.isSendable()){
            await channel.send(message);
            return true;
        }
        this.bridge.log('warn',`DiscordApi WorkerClient.sendMessage 发送失败\n`+
            `channelId:${channel?.id}\n` +
            `channel.isSendable:${channel?.isSendable()}\n`+
            `userId:${userId}\n`+
            `groupId:${groupId}\n`+
            `message:${message}`
        );
        return false;
    }
    async sendVoice(arg: SendVoiceArg){
        const {userId,voiceFilePath,groupId}=arg;
        const channel = groupId==null
            ? this.client.channels.cache.get(this.UserIdChnnelIdMap[userId])
            : this.client.channels.cache.get(this.GroupIdChnnelIdMap[groupId]);
        if(channel?.isSendable()){
            //const oggpath = await transcode2opusogg(voiceFilePath,256);
            const audioBuffer = await fs.promises.readFile(voiceFilePath);
            const attr = new AttachmentBuilder(audioBuffer, { name: 'voice.wav' });
            await channel.send({files:[attr]});
            return true;
        }
        this.bridge.log('warn',`DiscordApi WorkerClient.sendVoice 发送失败\n`+
            `channelId:${channel?.id}\n` +
            `channel.isSendable:${channel?.isSendable()}\n`+
            `userId:${userId}\n`+
            `groupId:${groupId}\n`+
            `voiceFilePath:${voiceFilePath}`
        );
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