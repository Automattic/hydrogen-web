export type RequestId = string;
export type RequestType = string;

export interface Request {
    id: RequestId;
    type: RequestType;
    data: object;
}

export function makeRequestId(): RequestId {
    return makeId() as RequestId;
}

export interface Response {
    request: Request;
    error?: Error;
    data?: object;
}

function makeId(): string {
    return (Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)).toString();
}
