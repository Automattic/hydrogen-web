import {RoomViewModel} from "./RoomViewModel";

export class WorldReadableRoomViewModel extends RoomViewModel {
    constructor(options) {
        options.room.isWorldReadable = true;
        super(options);
        this._session = options.session;
    }

    get kind() {
        return "preview";
    }

    dispose() {
        super.dispose();
        void this._session.deleteWorldReadableRoomData(this.roomIdOrAlias);
    }
}
