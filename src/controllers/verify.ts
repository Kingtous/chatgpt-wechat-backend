import { FastifyInstance, FastifyRequest } from "fastify";
import { apiPath, wechatToken } from "../../const";
import { toSha1 } from "../utils/encrypt";

interface VerifyQuery {
    signature: string,
    timestamp: number,
    nonce: number,
    echostr: string,
    openid: string
}

export function checkIsWechatRequest(request: FastifyRequest) {
    const q = request.query as VerifyQuery;
    try {
        let arr: string[] = [wechatToken, q.timestamp.toString(), q.nonce.toString()];
        arr.sort((a, b) => a.localeCompare(b));
        const sha1 = toSha1(arr.join(""))
        if (sha1 === q.signature) {
            // Success.
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

function route(server: FastifyInstance) {
    // setup hook
    server.addHook("onRequest", (request, reply, done) => {
        if (checkIsWechatRequest(request)) {
            // Continue.
            done();
        } else {
            reply.send("who are you?");
        }
    });

    server.get(apiPath, (request: FastifyRequest, reply) => {
        const q = request.query as VerifyQuery;
        if (checkIsWechatRequest(request)) {
            // Success.
            reply.send(q.echostr)
        } else {
            reply.send("who are you?")
        }
    })
}

export default route;
