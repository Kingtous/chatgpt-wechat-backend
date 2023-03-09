import Sha1 from 'sha1';

export function toSha1(str: string) {
    return Sha1(str);
}