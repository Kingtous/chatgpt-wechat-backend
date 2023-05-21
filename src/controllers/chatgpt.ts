import axios from 'axios';
import { FastifyReply } from 'fastify';
import { chatgptKey } from '../../const';
import {Transform, TransformCallback} from 'stream';

const context = new Map<string, object[]>()
const MAX_TOKEN_LEN = 500;
const CONTEXT_MAX_LEN_PER_USER = 10;

// <xml>
//   <ToUserName><![CDATA[toUser]]></ToUserName>
//   <FromUserName><![CDATA[fromUser]]></FromUserName>
//   <CreateTime>12345678</CreateTime>
//   <MsgType><![CDATA[text]]></MsgType>
//   <Content><![CDATA[你好]]></Content>
// </xml>
class ChatGPTAsyncStream extends Transform {
  public prefix: string = "<xml><ToUserName><![CDATA[toUser]]></ToUserName><FromUserName><![CDATA[fromUser]]></FromUserName><CreateTime>12345678</CreateTime><MsgType>text</MsgType><Content>"
  public suffix: string = "</Content></xml>"

  constructor(toUser: string, fromUser: string) {
    super()
    this.prefix = this.prefix.replace("<![CDATA[toUser]]>", toUser).replace("<![CDATA[fromUser]]>", fromUser).replace("12345678", Date.now().toString());
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    const chunkBuffer: Buffer = chunk;
    const prefixedChunk = Buffer.from(chunkBuffer+ this.suffix.toString());
    this.push(prefixedChunk);
    console.log("transform chatgpt", prefixedChunk);
    callback();
  }
}

export async function getChatGPTAnswerSync(content: string, user: string) {
    var contextForUser = context.get(user) ?? [];
    contextForUser.push({
        'role': 'user',
        'content': content,
        'name': user 
    });
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            'model': 'gpt-3.5-turbo',
            'messages': contextForUser,
            'max_tokens': MAX_TOKEN_LEN,
            'user': user
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + chatgptKey
            },
            timeout: 60000 * 5, // 5分钟超时
            timeoutErrorMessage: "访问超时了，请稍后再尝试吧"
        }
    );
    const resp = response.data.choices[0].message.content;
    contextForUser.push({
        'role': 'assistant',
        'content': resp,
        'name': "GPT" 
    });
    if (contextForUser.length > CONTEXT_MAX_LEN_PER_USER) {
        contextForUser = contextForUser.slice(contextForUser.length - CONTEXT_MAX_LEN_PER_USER, contextForUser.length);
    }
    context.set(user, contextForUser);
    return resp;
}

export async function getChatGPTAnswerStream(content: string, toUser: string, fromUser: string, reply: FastifyReply) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'user',
                    'content': content,
                    'name': fromUser.substring(0, Math.min(fromUser.length, 64)),
                }
            ],
            'stream': true
        },
        {
            responseType: "stream",
            headers: {
                'Content-Type': 'application/json', 'stream': true,
                'Authorization': 'Bearer ' + chatgptKey
            },
            timeout: 15000 * 4 * 5, // 5分钟超时
            timeoutErrorMessage: "访问超时了，请稍后再尝试吧"
        }
    );
    const s = new ChatGPTAsyncStream(toUser, fromUser);
    reply.raw.write(s.prefix);
    // add prefix
    const prefixedStream = response.data.pipe(s);
    prefixedStream.pipe(reply.raw);
}