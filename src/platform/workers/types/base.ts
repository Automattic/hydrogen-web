export type RequestId = string;
export type RequestType = string;

export interface Request {
    id: RequestId;
    type: RequestType;
    data: object;
}

export interface Response {
    request: Request;
    error?: Error;
    data?: object;
}
