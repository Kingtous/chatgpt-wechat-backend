import axios from 'axios';
import { FastifyReply } from 'fastify';
import { chatgptKey } from '../../const';

export async function getChatGPTAnswerSync(content: string, user: string) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'user',
                    'content': content
                }
            ],
            'max_tokens': 120,
            'user': user
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + chatgptKey
            },
            timeout: 15000, // 15s超时
            timeoutErrorMessage: "访问超时了，请稍后再尝试吧"
        }
    );
    return "回答来咯：\n" + response.data.choices[0].message.content;
}

export async function getChatGPTAnswerStream(content: string, reply: FastifyReply) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            'model': 'gpt-3.5-turbo',
            'messages': [
                {
                    'role': 'user',
                    'content': content
                }
            ]
        },
        {
            responseType: "stream",
            headers: {
                'Content-Type': 'application/json', 'stream': true,
                'Authorization': 'Bearer ' + chatgptKey
            },
            timeout: 15000, // 15s超时
            timeoutErrorMessage: "访问超时了，请稍后再尝试吧"
        }
    );
    return response.data;
}