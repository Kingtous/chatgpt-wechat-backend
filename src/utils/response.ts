import { XMLBuilder } from "fast-xml-parser";
import axios from 'axios';
import { wechatToken } from "../../const";



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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + wechatToken
            }
        })
}