import axios from "axios";
import { wechatAppID, wechatSecret } from "../const";

async function getAccessToken() {
    const json = await axios.get("https://api.weixin.qq.com/cgi-bin/token", {
        params: {
            grant_type: "client_credential",
            appid: wechatAppID,
            secret: wechatSecret
        }
    });
    process.env.WECHAT_ACESS_TOKEN = json.data.access_token;
}

export default async function initJobs() {
    if (wechatAppID.length !== 0) {
        await getAccessToken();
        setInterval(() => {
            getAccessToken();
        }, (3600 + 1800) * 1000) // 1.5h
    }
}