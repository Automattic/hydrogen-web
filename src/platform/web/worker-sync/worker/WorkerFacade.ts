import {Request, ResponseData} from "./Worker";

export class WorkerFacade {
    async sendAndWaitForReply(request: Request): Promise<ResponseData> {
        // TODO
        return {
            type: request.type,
            data: { success: true }
        };
    }
}
