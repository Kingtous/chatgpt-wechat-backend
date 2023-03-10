import axios from 'axios';
import { chatgptKey } from '../../const';


export async function getChatGPTAnswerSync(content: string) {
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
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + chatgptKey
            },
            timeout: 30000, // 30s超时
            timeoutErrorMessage: "访问超时了，请稍后再尝试吧"
        }
    );
    return response.data
}