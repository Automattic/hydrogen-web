import {RoomViewModel} from "./RoomViewModel";

export class WorldReadableRoomViewModel extends RoomViewModel {
    constructor(options) {
        options.room.isWorldReadable = true;
        super(options);
        const {room, session, guestJoinAllowed} = options;
        this._room = room;
        this._session = session;
        this._error = null;
        this._busy = false;
        this._guestJoinAllowed = typeof guestJoinAllowed !== 'undefined' && guestJoinAllowed;

        // join allowed for the current user/session?
        this._joinAllowed = false;
        this._session.isGuest().then((isGuest) => {
            this._joinAllowed = isGuest ? this._guestJoinAllowed : true;
            this.emitChange('joinAllowed');
        });
    }

    get kind() {
        return "preview";
    }

    get busy() {
        return this._busy;
    }

    get joinAllowed() {
        return this._joinAllowed;
    }

    async join() {
        this._busy = true;
        this.emitChange("busy");
        try {
            const roomId = await this._session.joinRoom(this._room.id);
            // navigate to roomId if we were at the alias
            // so we're subscribed to the right room status
            // and we'll switch to the room view model once
            // the join is synced
            this.navigation.push("room", roomId);
            // keep busy on true while waiting for the join to sync
        } catch (err) {
            this._error = err;
            this._busy = false;
            this.emitChange("error");
        }
    }

    login() {
        this.navigation.push("login");
    }

    dispose() {
        super.dispose();

        // if joining the room, _busy would be true and in that case don't delete records
        if (!this._busy) {
            void this._session.deleteWorldReadableRoomData(this._room.id);
        }
    }
}
