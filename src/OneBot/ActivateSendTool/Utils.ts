import { SendBaseArg } from "@/src/ChatPlantformInterface";


export const chkType = (opt:SendBaseArg)=>{
    if(/.+user.+/.test(opt.channelId))
        return "private_message" as const;
    return "group_message" as const;
}