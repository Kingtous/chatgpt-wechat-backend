/// ACCESS_TOKEN START
(globalThis as any).accessToken = "";

/// KEY START
export const chatgptKey: string = process.env.CHATGPT_KEY ?? "";
export const wechatToken: string = process.env.WECHAT_TOKEN ?? "";
export const wechatAppID: string = process.env.WECHAT_APPID ?? "";
export const wechatSecret: string = process.env.WECHAT_SECRET ?? "";
export function wechatAccessToken() {
    return process.env.WECHAT_ACESS_TOKEN ?? "";
}
/// KEY END

/// API ADDR START
export const apiPath = "/wechat/api";
/// API ADDR END