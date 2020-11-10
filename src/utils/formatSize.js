/*
Copyright 2020 The Matrix.org Foundation C.I.C.

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

export function formatSize(size, decimals = 2) {
    if (Number.isSafeInteger(size)) {
        const base = Math.min(3, Math.floor(Math.log(size) / Math.log(1024)));
        const decimalFactor = Math.pow(10, decimals);
        const formattedSize = Math.round((size / Math.pow(1024, base)) * decimalFactor) / decimalFactor;
        switch (base) {
            case 0: return `${formattedSize} bytes`;
            case 1: return `${formattedSize} KB`;
            case 2: return `${formattedSize} MB`;
            case 3: return `${formattedSize} GB`;
        }
    }
}
