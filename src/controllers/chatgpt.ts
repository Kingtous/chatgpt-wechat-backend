import axios from 'axios';
import { FastifyReply } from 'fastify';
import { chatgptKey } from '../../const';
import {Transform, TransformCallback} from 'stream';
import { json } from 'stream/consumers';

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
    // var chunkString = "{" + chunkBuffer.toString() + "}";
    // chunkString = chunkString.replace("{data:", "{\"data\":");
    // console.log("chunk: ", chunkString);
    // const text = JSON.parse(chunkString)['data']['choices'][0]['delta']['content'] ?? "";
    const prefixedChunk = Buffer.from(chunkBuffer+ this.suffix.toString());
    this.push(prefixedChunk);
    console.log("transform chatgpt", prefixedChunk);
    callback();
  }
}

export async function getChatGPTAnswerSync(content: string, user: string) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'user',
                    'content': content,
                    'name': user
                }
            ],
            'max_tokens': 1000,
            'user': user
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + chatgptKey
            },
            timeout: 60000, // 60s超时
            timeoutErrorMessage: "访问超时了，请稍后再尝试吧"
        }
    );
    return response.data.choices[0].message.content;
}

export async function getChatGPTAnswerStream(content: string, toUser: string, fromUser: string, reply: FastifyReply) {
    console.log("start with stream")
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
            // timeout: 15000, // 15s超时
            timeoutErrorMessage: "访问超时了，请稍后再尝试吧"
        }
    );
    console.log("start stream");
    const s = new ChatGPTAsyncStream(toUser, fromUser);
    reply.raw.write(s.prefix);
    // add prefix
    const prefixedStream = response.data.pipe(s);
    console.log("pipe raw");
    prefixedStream.pipe(reply.raw);
}