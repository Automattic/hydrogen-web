/*
Copyright 2021 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {InlineTemplateView, TemplateView} from "../../general/TemplateView";
import {AvatarView} from "../../AvatarView";
import {TimelineView} from "./TimelineView";
import {TimelineLoadingView} from "./TimelineLoadingView";
import {spinner} from "../../common.js";
import {viewClassForTile} from "./common";

export class UnknownRoomView extends TemplateView {

    constructor(vm) {
        super(vm);
    }

    regularView(vm, t) {
        return new InlineTemplateView(vm, (t, m) => {
            return t.div([
                t.h2([
                    vm.i18n`You are currently not in ${vm.roomIdOrAlias}.`,
                    t.br(),
                    vm.i18n`Want to join it?`
                ]),
                t.button({
                    className: "button-action primary",
                    onClick: () => vm.join(),
                    disabled: vm => vm.busy,
                }, vm.i18n`Join room`),
                t.br(),
                t.if(vm => vm.checkingPreviewCapability, t => t.div({className: "checkingPreviewCapability"}, [
                    spinner(t),
                    t.p(vm.i18n`Checking preview capability...`)
                ])),
                t.if(vm => vm.error, t => t.p({className: "error"}, vm.error))
            ]);
        });
    }

    previewView(vm, t) {
        return new InlineTemplateView(vm, (t, m) => {
            return t.div({className: "RoomView WorldReadableRoomView"}, [
                t.div({className: "RoomHeader middle-header"}, [
                    t.view(new AvatarView(vm, 32)),
                    t.div({className: "room-description"}, [
                        t.h2(vm => vm.room.name),
                    ]),
                ]),
                t.div({className: "RoomView_body"}, [
                    t.div({className: "RoomView_error"}, [
                        t.if(vm => vm.error, t => t.div([
                            t.p({}, vm => vm.error),
                            t.button({className: "RoomView_error_closerButton", onClick: evt => vm.dismissError(evt)})
                        ]))
                    ]),
                    t.mapView(vm => vm.timelineViewModel, timelineViewModel => {
                        return timelineViewModel ?
                            new TimelineView(timelineViewModel, viewClassForTile) :
                            new TimelineLoadingView(vm);    // vm is just needed for i18n
                    }),
                    t.div({className: "WorldReadableRoomComposerView"}, [
                        t.h3(vm => vm.i18n`Join the room to participate`),
                        t.button({className: "joinRoomButton", onClick: () => vm.join()}, vm.i18n`Join Room`)
                    ])
                ])
            ]);
        });
    }

    render(t, vm) {
        return t.main({className: "UnknownRoomView middle"}, t.mapView(vm => vm.kind, kind => {
            return vm.previewPossible ? this.previewView(vm, t) : this.regularView(vm, t);
        }));
    }
}
