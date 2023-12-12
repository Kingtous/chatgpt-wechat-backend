import aws from 'aws-sdk';
const s3 = new aws.S3();
const kBucketName = process.env.BUCKET_NAME || '';

interface StoreObj {
    type: string;
    obj: any;
}

interface Bean {
    user: string;
    objs: StoreObj[];
}

function getKeyForUser(user: string): string  {
    return user + '.his.json';
}

export async function storeAskToUser(user: string, ask: string) {
    return await storeObjToUser(user, ask, 'ask');
}

export async function storeAnswerToUser(user: string, answer: string) {
    return await storeObjToUser(user, answer, 'ans');
}

async function storeObjToUser(user: string, obj: any, type: string) {
    var histories = await queryHistoryForUser(user);
    console.log('origin history: ' + JSON.stringify(histories));
    if (histories == null) {
        histories = {
            user: user,
            objs: []
        };
    }
    histories.objs.push({
        type: type,
        obj: obj
    });
    if (histories.objs.length >= 20) {
        histories.objs = histories.objs.slice(histories.objs.length - 20);
    }
    return await s3.putObject({
        Body: JSON.stringify(histories),
        Bucket: kBucketName,
        Key: getKeyForUser(user),
        ContentType: 'application/json',
    }).promise();
}

export async function queryHistoryForUser(user: string) : Promise<any> {
    try {
        const objectResp = await s3.getObject({
            Bucket: kBucketName,
            Key: getKeyForUser(user),
            ResponseContentType: 'application/json'
        }).promise();
        const json = JSON.parse(objectResp.Body?.toString() ?? '');
        return json;
    } catch (e) {
        // console.log(e);
        return null;
    }
}

export function formatHistory(objs: StoreObj[]): string {
    var ans = '';
    for (let i = 0; i < objs.length; i++) {
        var obj = objs[i];
        if (obj.type == 'ans') {
            ans += '\n答：' + obj.obj;
        } else {
            ans += '\n问：' + obj.obj;
        }
    }
    return ans;
}

export async function cleanHistoryForUser(user: string) {
    try {
        await s3.deleteObject({
            Bucket: kBucketName,
            Key: getKeyForUser(user)
        }).promise()
    } catch (e) {
        // ignore
    }
}

// test('store', async () => {
//     await cleanHistoryForUser('test');
//     var res = await queryHistoryForUser('test');
//     console.log(res);
//     await storeAskToUser('test', 'asking!')
//     await storeAnswerToUser('test', 'ack!')
//     var res = await queryHistoryForUser('test');
//     console.log(res);
//     console.log(formatHistory(res.objs));
//     await cleanHistoryForUser('test');
//     res = await queryHistoryForUser('test');
//     console.log(res);
// });
