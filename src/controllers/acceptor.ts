import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { apiPath, wechatToken } from "../../const";
import { toSha1 } from "../utils/encrypt";
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { newTextResponse, sendText } from "../utils/response";
import { getChatGPTAnswerSync } from "./chatgpt";
import { setTimeout } from "timers/promises";

const xmlParser = new XMLParser()
var cacheMap = new Map()
var checkTimes = new Map()

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
    const msg = xml.Content.toString() as string;
    if (msg.trim().length == 0) {
        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "咋回事，不能发送空内容哦"));
    } else {
        let requestKey = xml.FromUserName + "_" + xml.CreateTime;
        if (!cacheMap.has(requestKey)) {
            getChatGPTAnswerSync(msg, xml.FromUserName.toString()).then((response) => {
                cacheMap.set(requestKey, response);
            }).catch((reason) => {
                cacheMap.set(requestKey, reason);
            })
            cacheMap.set(requestKey, null);
            checkTimes.set(requestKey, 1);
            setTimeout(30 * 1000, () => {
                cacheMap.delete(requestKey);
                checkTimes.delete(requestKey);
            });
            console.log(checkTimes.get(requestKey));
        } else {
            let resp = cacheMap.get(requestKey);
            if (resp != null) {
                reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, resp));
            } else {
                let checkTime = checkTimes.get(requestKey) as number;
                if (checkTime === 2) {
                    let resp = cacheMap.get(requestKey);
                    if (resp != null) {
                        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, resp));
                    } else {
                        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "哎哟，超时啦！可以重试一下呢，或者问一个简单一点的问题，或者帮作者大大解决这个限制哦 https://github.com/Kingtous/chatgpt-wechat-backend。\n 由于wx功能限制，目前只允许15s内返回数据，所以我只能等待AI思考10s哦，目前还在想办法解决这个问题呢。"));
                    }
                } else {
                    checkTimes.set(requestKey, checkTimes.get(requestKey) as number + 1);
                    console.log(checkTimes.get(requestKey));
                }
            }
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