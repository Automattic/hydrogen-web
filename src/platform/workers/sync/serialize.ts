import {RoomChanges, SessionChanges} from "../types/sync";
import {type Room} from "../../../matrix/room/Room";
import {EventEntry} from "../../../matrix/room/timeline/entries/EventEntry";
import {MemberChange, RoomMember} from "../../../matrix/room/members/RoomMember";
import {type DecryptionResult} from "../../../matrix/e2ee/DecryptionResult";
import {EventKey} from "../../../matrix/room/timeline/EventKey";

type InMemorySessionSyncState = {
    changes: {
        syncInfo: {
            token: string,
            filterId: string,
        },
        hasNewRoomKeys: boolean,
        e2eeAccountChanges?: number,
        deviceMessageDecryptionResults: DecryptionResult[]|null,
    }
}

type InMemoryRoomSyncState = {
    room: Room,
    changes: {
        roomResponse: object,
        newEntries: EventEntry[],
        updatedEntries: EventEntry[],
        memberChanges: Map<string, MemberChange>,
        newLiveKey: EventKey,
        summaryChanges: object,
        heroChanges: object,
        powerLevelsEvent: object,
    }
}

export function serializeSessionChanges(sessionState: InMemorySessionSyncState): SessionChanges {
    return sessionState.changes;
}

export function deserializeSessionChanges(sessionChanges: SessionChanges): InMemorySessionSyncState {
    return {
        changes: sessionChanges,
    }
}

export function serializeRoomChanges(roomState: InMemoryRoomSyncState): RoomChanges {
    const {room, changes} = roomState;
    const {roomResponse, summaryChanges, heroChanges, powerLevelsEvent} = changes;
    const newEntries = changes.newEntries.map((entry: EventEntry) => entry.data);
    const updatedEntries = changes.updatedEntries.map((entry: EventEntry) => entry.data);

    const memberChanges = new Map<string, { member: object, previousMembership: string }>;
    for (let [key, mc] of changes.memberChanges) {
        const {member, previousMembership} = mc;
        memberChanges.set(key, {member: member.data, previousMembership});
    }

    const newLiveKey = {
        fragmentId: changes.newLiveKey.fragmentId,
        eventIndex: changes.newLiveKey.eventIndex,
    }

    return {
        roomId: room.id,
        changes: {
            roomResponse,
            newEntries,
            updatedEntries,
            memberChanges,
            newLiveKey,
            summaryChanges,
            heroChanges,
            powerLevelsEvent,
        }
    }
}

export function deserializeRoomChanges(room: Room, roomChanges: RoomChanges): InMemoryRoomSyncState {
    const {changes} = roomChanges;
    const {roomResponse, newEntries, updatedEntries, memberChanges, newLiveKey} = changes;

    const deserializedNewEntries = newEntries.map(entry => new EventEntry(entry, room._fragmentIdComparer));
    const deserializedUpdatedEntries = updatedEntries.map(entry => new EventEntry(entry, room._fragmentIdComparer));

    const deserializedMemberChanges = new Map<string, MemberChange>;
    for (let [key, mc] of memberChanges) {
        deserializedMemberChanges.set(key, new MemberChange(new RoomMember(mc.member), mc.previousMembership))
    }

    const deserializedNewLiveKey = new EventKey(newLiveKey.fragmentId, newLiveKey.eventIndex);

    const deserializedSummaryChanges = changes.summaryChanges;
    const deserializedHeroChanges = changes.heroChanges;
    const deserializedPowerLevelsEvent = changes.powerLevelsEvent;

    return {
        room,
        changes: {
            roomResponse,
            newEntries: deserializedNewEntries,
            updatedEntries: deserializedUpdatedEntries,
            memberChanges: deserializedMemberChanges,
            newLiveKey: deserializedNewLiveKey,
            summaryChanges: deserializedSummaryChanges,
            heroChanges: deserializedHeroChanges,
            powerLevelsEvent: deserializedPowerLevelsEvent,
        }
    };
}
