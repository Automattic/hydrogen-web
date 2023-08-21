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

import {TemplateView} from "../../general/TemplateView";
import {spinner} from "../../common.js";
import {Menu} from "../../general/Menu.js";
import {Popup} from "../../general/Popup.js";

export class UnknownRoomView extends TemplateView {
    render(t, vm) {
        return t.main({className: "RoomView UnknownRoomView middle"}, [
            t.div({className: "UnknownRoomView_header RoomHeader middle-header"}, [
                t.a({className: "button-utility close-middle", href: vm.closeUrl, title: vm.i18n`Cancel room join`}),
                t.div({className: "room-description"},[
                    t.h2(vm.i18n`Join room`),
                ]),
                t.button({
                    className: "button-utility room-options",
                    "aria-label":vm.i18n`Room options`,
                    onClick: evt => this._toggleOptionsMenu(evt,vm)
                })
            ]),
            t.div({className: "UnknownRoomView_body centered-column"}, [
                t.div({className: "UnknownRoomView_container"}, [
                    t.h2([
                        vm.i18n`You are currently not in ${vm.roomIdOrAlias}.`,
                    ]),
                    t.if(vm => vm.joinAllowed, t => t.div([
                        t.h3(vm.i18n`Want to join it?`),
                        t.button({
                            className: "button-action primary",
                            onClick: () => vm.join(),
                            disabled: vm => vm.busy,
                        }, vm.i18n`Join room`),
                    ])),
                    t.if(vm => vm.checkingPreviewCapability, t => t.div({className: "checkingPreviewCapability"}, [
                        spinner(t),
                        t.p(vm.i18n`Checking preview capability...`)
                    ])),
                    t.if(vm => vm.error, t => t.p({className: "error"}, vm.error))
                ])
            ])
        ]);
    }

    _toggleOptionsMenu(evt,vm) {
        if (super._optionsPopup && super._optionsPopup.isOpen) {
            super._optionsPopup.close();
        } else {
            const optionsPopup = new Popup(new Menu([
                Menu.option(vm.i18n`Settings`, () => vm.navigation.push("settings"))
            ]));
            optionsPopup.trackInTemplateView(this);
            optionsPopup.showRelativeTo(evt.target, 10);
            super._optionsPopup = optionsPopup;
        }
    }
}
