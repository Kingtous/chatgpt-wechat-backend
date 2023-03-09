import {FastifyInstance, FastifyRequest} from "fastify";
import { apiPath, wechatToken } from "../../const";
import { toSha1 } from "../utils/encrypt";

interface VerifyQuery {
    signature: string,
    timestamp: number,
    nonce: number,
    echostr: string
}

function route(server: FastifyInstance) {
    server.get(apiPath, (request: FastifyRequest, reply) => {
        const q = request.query as VerifyQuery;
        let arr: string[] = [wechatToken, q.timestamp.toString(), q.nonce.toString()];
        arr.sort((a,b) => a.localeCompare(b));
        const sha1 = toSha1(arr.join(""))
        if (sha1 === q.signature) {
            // Success.
            reply.send(q.echostr)
        } else {
            reply.send("who are you?")
        }
    })
}

export default route;
