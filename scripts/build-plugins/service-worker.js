const fs = require('fs/promises');
const path = require('path');
const xxhash = require('xxhashjs');

function contentHash(str) {
    var hasher = new xxhash.h32(0);
    hasher.update(str);
    return hasher.digest();
}

module.exports = function injectServiceWorker(swFile, otherUncachedFiles, globalHashChunkReplaceMap) {
    const swName = path.basename(swFile);
    let root;
    let version;

    return {
        name: "hydrogen:injectServiceWorker",
        apply: "build",
        enforce: "post",
        buildStart() {
            this.emitFile({
                type: "chunk",
                fileName: swName,
                id: swFile,
            });
        },
        configResolved: config => {
            root = config.root;
            version = JSON.parse(config.define.HYDROGEN_VERSION); // unquote
        },
        generateBundle: async function(options, bundle) {
            const uncachedFileNames = [swName].concat(otherUncachedFiles);
            const uncachedFileContentMap = uncachedFileNames.reduce((map, fileName) => {
                const chunkOrAsset = bundle[fileName];
                if (!chunkOrAsset) {
                    throw new Error("could not get content for uncached asset or chunk " + fileName);
                }
                map[fileName] = chunkOrAsset.source || chunkOrAsset.code;
                return map;
            }, {});
            const assets = Object.values(bundle);
            const cachedFileNames = assets.map(o => o.fileName).filter(fileName => !uncachedFileContentMap[fileName]);
            const globalHash = getBuildHash(cachedFileNames, uncachedFileContentMap);
            const sw = bundle[swName];
            sw.code = replaceConstsInServiceWorker(sw.code, version, globalHash, assets);
            replaceGlobalHashPlaceholderInChunks(assets, globalHashChunkReplaceMap, globalHash);
            console.log(`\nBuilt ${version} (${globalHash})`);
        }
    };
}

function getBuildHash(cachedFileNames, uncachedFileContentMap) {
    const unhashedHashes = Object.entries(uncachedFileContentMap).map(([fileName, content]) => {
        return `${fileName}-${contentHash(Buffer.from(content))}`;
    });
    const globalHashAssets = cachedFileNames.concat(unhashedHashes);
    globalHashAssets.sort();
    return contentHash(globalHashAssets.join(",")).toString();
}

const NON_PRECACHED_JS = [
    "hydrogen-legacy",
    "olm_legacy.js",
     // most environments don't need the worker
    "main.js"
];

function isPreCached(asset) {
    const {name, fileName} = asset;
    return  name.endsWith(".svg") ||
            name.endsWith(".png") ||
            name.endsWith(".css") ||
            name.endsWith(".wasm") ||
            name.endsWith(".html") ||
            // the index and vendor chunks don't have an extension in `name`, so check extension on `fileName`
            fileName.endsWith(".js") && !NON_PRECACHED_JS.includes(path.basename(name));
}

function replaceConstsInServiceWorker(swSource, version, globalHash, assets) {
    const unhashedPreCachedAssets = [];
    const hashedPreCachedAssets = [];
    const hashedCachedOnRequestAssets = [];

    for (const asset of assets) {
        const {name: unresolved, fileName: resolved} = asset;
        if (!unresolved || resolved === unresolved) {
            unhashedPreCachedAssets.push(resolved);
        } else if (isPreCached(asset)) {
            hashedPreCachedAssets.push(resolved);
        } else {
            hashedCachedOnRequestAssets.push(resolved);
        }
    }

    const replaceArrayInSource = (name, value) => {
        const newSource = swSource.replace(`${name} = []`, `${name} = ${JSON.stringify(value)}`);
        if (newSource === swSource) {
            throw new Error(`${name} was not found in the service worker source`);
        }
        return newSource;
    };
    const replaceStringInSource = (name, value) => {
        const newSource = swSource.replace(new RegExp(`${name}\\s=\\s"[^"]*"`), `${name} = ${JSON.stringify(value)}`);
        if (newSource === swSource) {
            throw new Error(`${name} was not found in the service worker source`);
        }
        return newSource;
    };

    // write service worker
    swSource = swSource.replace(`"%%VERSION%%"`, `"${version}"`);
    swSource = swSource.replace(`"%%GLOBAL_HASH%%"`, `"${globalHash}"`);
    swSource = replaceArrayInSource("UNHASHED_PRECACHED_ASSETS", unhashedPreCachedAssets);
    swSource = replaceArrayInSource("HASHED_PRECACHED_ASSETS", hashedPreCachedAssets);
    swSource = replaceArrayInSource("HASHED_CACHED_ON_REQUEST_ASSETS", hashedCachedOnRequestAssets);
    swSource = replaceStringInSource("NOTIFICATION_BADGE_ICON", assets.find(a => a.name === "icon.png").fileName);
    return swSource;
}

function replaceGlobalHashPlaceholderInChunks(assets, globalHashChunkReplaceMap, globalHash) {
    for (const [name, placeholder] of Object.entries(globalHashChunkReplaceMap)) {
        const chunk = assets.find(a => a.type === "chunk" && a.name === name);
        if (!chunk) {
            throw new Error(`could not find chunk ${name} to replace global hash placeholder`);
        }
        console.log(placeholder, globalHash);
        chunk.code = chunk.code.replaceAll(placeholder, `"${globalHash}"`);
    }
}
