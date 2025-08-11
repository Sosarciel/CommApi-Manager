import { SendBaseArg } from "@/src/ChatPlantformInterface";


export const chkType = (opt:SendBaseArg)=>{
    if(opt.groupId==undefined)
        return "private_message" as const;
    return "group_message" as const;
}