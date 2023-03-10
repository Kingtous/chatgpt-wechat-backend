import {FastifyInstance} from "fastify";
import verify from './controllers/verify';
import acceptor from './controllers/acceptor';
import axios from 'axios';

axios.interceptors.request.use(request => {
    console.log('Starting Request', JSON.stringify(request, null, 2))
    return request
})

axios.interceptors.response.use(response => {
    console.log('Response:', JSON.stringify(response.data, null, 2))
    return response
})

function setUpRouter(server: FastifyInstance) {
    // 校验
    verify(server);
    acceptor(server);
}

export default setUpRouter;