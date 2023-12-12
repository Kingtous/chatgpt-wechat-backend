import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { apiPath, wechatToken } from "../../const";
import { toSha1 } from "../utils/encrypt";
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { newTextResponse, sendText } from "../utils/response";
import { getChatGPTAnswerStream, getChatGPTAnswerSync } from "./chatgpt";
import { setTimeout } from "timers/promises";
import { cleanHistoryForUser, formatHistory, queryHistoryForUser, storeAnswerToUser, storeAskToUser } from "../utils/store";

const requestingMap = new Map<string, boolean>()
const footerText = "由 khoming 公众号提供服务";

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
    var msg = (xml.Content.toString() as string).trim();
    if (msg.length == 0) {
        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "咋回事，不能发送空内容哦" + footerText));
    } else if (msg === '/q') {
        const ans = await queryHistoryForUser(xml.FromUserName);
        if (ans == null) {
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "您暂时还没有回答，如果您已输入问题，请耐心等待一会哦，输入/q可以再次查询" + footerText));
        } else {
            const ansString = formatHistory(ans.objs);
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "您有" + ans.objs.length + "条历史回答：\n\n" + ansString + footerText));
        }
    } else if (msg === '/c') {
        await cleanHistoryForUser(xml.FromUserName);
        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "已清除历史回答" + footerText));
    } else if (msg.startsWith('/a ')){
        msg = msg.substring(2);
        if (!(requestingMap.get(xml.FromUserName) ?? false)) {
            requestingMap.set(xml.FromUserName, true);
            getChatGPTAnswerSync(msg, xml.FromUserName).then(async (answer) => {
                await storeAnswerToUser(xml.FromUserName, answer);
                requestingMap.set(xml.FromUserName, false);
            }).catch((e) => {
                requestingMap.set(xml.FromUserName, false);
                storeAnswerToUser(xml.FromUserName, '请求失败，请重试。');
            });
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "问题是：" + msg + "\n\n请求中，输入/q可查询最近问答。" + footerText));
            // add to s3
            storeAskToUser(xml.FromUserName, msg);
        } else {
            reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "已有正在运行的请求，请耐心等候，输入/q 查询最近回答。" + footerText));
        }
    } else {
        reply.send(newTextResponse(xml.FromUserName, xml.ToUserName, "未知指令。指令列表：\n1. /q 查询历史结果。\n2. /c 清除所有记录。\n3. /a xxx 询问xxx."));
    }
}

function route(server: FastifyInstance) {
    server.post(apiPath, (request, reply) => {
        const xml = request.body as any;
        handleMsg(xml.xml, reply)
    })
}

export default route;