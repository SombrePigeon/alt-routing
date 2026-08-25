import version from "./version.json" with { type: "json" };

const logPrefix = "[SW::alt-routing::lib]";
let _cacheName;
let _cacheNameVersion;
const url = new URL("../", import.meta.url);

const files = [
    "version.json",
    "namings.json",
    "config.json",
    "composition.json",
    "trustedTypes.js",
    "router.js",
    "route.js",
    "anchor.js",
    "form.js",
    "button.js",
    "input.js",
    "title.js"
];

let urlsSet;

export function init(cacheName)
{
    _cacheName = cacheName ?? "alt-routing";
    _cacheNameVersion = `${_cacheName}/${version}`;
    console.info(`${logPrefix} starting ... `);
    console.info(`${logPrefix} version : `, version);
    console.debug(`${logPrefix} cacheName : `, _cacheNameVersion);

    self.addEventListener("install",
        e =>
        {
            console.info(`${logPrefix} install version : ${version}`);

            const install = async _ =>
                {
                    if(await caches.has(_cacheNameVersion))
                    {
                        console.debug(`${logPrefix} ${_cacheNameVersion} already installed`);
                    }
                    else
                    {
                        console.debug(`${logPrefix} create cache : `, _cacheNameVersion);
                        const cache = await caches.open(_cacheNameVersion);
                        console.debug(`${logPrefix} cache created : `, _cacheNameVersion);

                        const urls = files.map(file => new URL(file, url).href);
                        console.debug(`${logPrefix} urls à mettre en cache`, urls);
                        
                        await cache.addAll(urls);
                        console.debug(`${logPrefix} added to cache`);
                    }
                    console.info(`${logPrefix} installed`);
                };
            e.waitUntil(install());
        }
    )

    self.addEventListener("activate",
        e =>
        {
            const remove = async _=>
            {
                const cacheKeys = await caches.keys();
                for(let key of cacheKeys)
                {
                    if(key.startsWith(`${_cacheName}/`))
                    {
                        if(key !== _cacheNameVersion)
                        {
                            await caches.delete(key);
                            console.debug(`${logPrefix} remove old version : `, key);
                        }
                    }
                }
                console.debug(`${logPrefix} old versions removed`);
                console.info(`${logPrefix} ${_cacheNameVersion} activated`);
            };
            e.waitUntil(remove());
        }
    )
}