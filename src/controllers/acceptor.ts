import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { apiPath, wechatToken } from "../../const";
import { toSha1 } from "../utils/encrypt";
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { newTextResponse, sendText } from "../utils/response";
import { getChatGPTAnswerSync } from "./chatgpt";

const xmlParser = new XMLParser()

function handleMsg(xml: any, reply: FastifyReply) {
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
function handleTextMsg(xml: any, reply: FastifyReply) {
    const msg = xml.Content as string;
    if (msg.trim().length == 0) {
        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "咋回事，不能发送空内容哦"));
    } else {
        getChatGPTAnswerSync(msg).then((response) => {
            sendText(xml.FromUserName, response);
        }).catch((reason) => {
            sendText(xml.FromUserName, "请求失败了：" + reason);
        })
        // 先返回空串
        reply.send("");
    }
}

function route(server: FastifyInstance) {
    server.post(apiPath, (request, reply) => {
        const xml = request.body as any;
        handleMsg(xml.xml, reply)
    })
}

export default route;