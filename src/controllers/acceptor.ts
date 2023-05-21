import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { apiPath, wechatToken } from "../../const";
import { toSha1 } from "../utils/encrypt";
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { newTextResponse, sendText } from "../utils/response";
import { getChatGPTAnswerStream, getChatGPTAnswerSync } from "./chatgpt";
import { setTimeout } from "timers/promises";

const xmlParser = new XMLParser()
var cacheMap = new Map()
const requestingMap = new Map<string, boolean>()
const footerText = "\n\n免费不易，进入https://kingtous.cn，关注作者的最新动态～";

async function handleMsg(xml: any, reply: FastifyReply) {
    if (xml.MsgType === "text") {
        handleTextMsg(xml, reply)
    } else {
        // fallback, 返回空串
        reply.send("");
    }
}

// <xml>
//   <ToUserName><![CDATA[toUser]]></ToUserName>
//   <FromUserName><![CDATA[fromUser]]></FromUserName>
//   <CreateTime>1348831860</CreateTime>
//   <MsgType><![CDATA[text]]></MsgType>
//   <Content><![CDATA[this is a test]]></Content>
//   <MsgId>1234567890123456</MsgId>
//   <MsgDataId>xxxx</MsgDataId>
//   <Idx>xxxx</Idx>
// </xml>
async function handleTextMsg(xml: any, reply: FastifyReply) {
    const msg = (xml.Content.toString() as string).trim();
    if (msg.length == 0) {
        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "咋回事，不能发送空内容哦" + footerText));
    } else if (msg === '0') {
        const ans: string[] = cacheMap.get(xml.FromUserName) ?? [];
        if (ans.length == 0) {
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "您暂时还没有回答，如果您已输入问题，请耐心等待一会哦，输入0可以再次查询" + footerText));
        } else {
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "您有" + ans.length + "条历史回答：\n" + ans.join("\n\n") + footerText));
        }
    } else {
        if (!(requestingMap.get(xml.FromUserName) ?? false)) {
            requestingMap.set(xml.FromUserName, true);
            getChatGPTAnswerSync(msg, xml.FromUserName).then((answer) => {
                if (cacheMap.get(xml.FromUserName) === undefined) {
                    cacheMap.set(xml.FromUserName, [answer]);
                } else {
                    var records: string[] = cacheMap.get(xml.FromUserName);
                    records.push(answer);
                    if (records.length > 5) {
                        records = records.slice(records.length - 5, records.length);
                        cacheMap.set(xml.FromUserName, records);
                    }
                }
                requestingMap.set(xml.FromUserName, false);
            }).catch((e) => {
                if (cacheMap.get(xml.FromUserName) === undefined) {
                    cacheMap.set(xml.FromUserName, ["请求失败：" + e.toString()]);
                } else {
                    var records: string[] = cacheMap.get(xml.FromUserName);
                    records.push("请求失败：" + e.toString());
                    if (records.length > 5) {
                        records = records.slice(records.length - 5, records.length);
                        cacheMap.set(xml.FromUserName, records);
                    }
                }
                requestingMap.set(xml.FromUserName, false);
            });
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "您的问题是：" + msg + "\n\n正在获取答案，输入0可查询最近5条回答哦。" + footerText));
        } else {
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "您有正在获取答案的请求，请耐心等候，输入0查询最近回答。" + footerText));
        }
    }
}

function route(server: FastifyInstance) {
    server.post(apiPath, (request, reply) => {
        const xml = request.body as any;
        handleMsg(xml.xml, reply)
    })
}

export default route;