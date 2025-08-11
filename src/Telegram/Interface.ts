



/**Telegram初始化选项 */
export type TelegramOption = {
    /**绑定角色名 */
    charname:string;
    /**登录token*/
    token: string;
    /**用户uid */
    uid:string;
    /**正向代理链接 */
    proxy_url?:string;
}

export type TelegramUserId  = `tgu_${string}`;
export type TelegramGroupId = `tgg_${string}`;