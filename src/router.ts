import {FastifyInstance} from "fastify";
import verify from './controllers/verify';

function setUpRouter(server: FastifyInstance) {
    // 校验
    verify(server);
}

export default setUpRouter;