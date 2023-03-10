import { XMLBuilder } from "fast-xml-parser";
import axios from 'axios';
import { wechatAccessToken, wechatToken } from "../../const";

export function newTextResponse(toUser: string, fromUser: string, text: string) {
    const xmlBuilder = new XMLBuilder({})
    // <xml>
    //   <ToUserName><![CDATA[toUser]]></ToUserName>
    //   <FromUserName><![CDATA[fromUser]]></FromUserName>
    //   <CreateTime>12345678</CreateTime>
    //   <MsgType><![CDATA[text]]></MsgType>
    //   <Content><![CDATA[你好]]></Content>
    // </xml>
    return xmlBuilder.build({
        "xml": {
            "ToUserName": toUser,
            "FromUserName": fromUser,
            "CreateTime": Date.now(),
            "MsgType": "text",
            "Content": text
        }
    })
}

/// 需要有客服权限的公众号才行
export async function sendText(toUser: string, content: string) {
    await axios.post("https://api.weixin.qq.com/cgi-bin/message/custom/send", {
        "touser": toUser, // OpenID
        "msgtype": "text",
        "text":
        {
            "content": content
        }
    },
        {
            params: {
                "access_token": wechatAccessToken()
            },
            headers: {
                "Content-Type": "application/json",
                "Authorization": ""
            }
        })
}