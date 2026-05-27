const version = "2.0.0-alpha.6";

const logPrefix = "[SW::alt-routing]";
let _cacheName;
let _cacheNameVersion;
const url = new URL("./", import.meta.url);

const files = [
    "namings.js",
    "config.json",
    "version.json",
    "composition.json",
    "router.js",
    "route.js",
    "anchor.js",
    "trustedTypes.js",
    "slot.js",
    "title.js",
];

let urls;

export function install(cacheName)
{
    _cacheName = cacheName ?? "alt-routing";
    _cacheNameVersion = `${_cacheName}/${version}`;
    console.debug(`${logPrefix} version : `, version);
    console.debug(`${logPrefix} cacheName : `, _cacheNameVersion);

    self.addEventListener("install",
        e =>
        {
            console.info(`${logPrefix} install version : ${version}`);

            urls = files.map(file => new URL(file, url).href);
            console.debug(`${logPrefix} urls à mettre en cache`, urls);

            const install = async _ =>
                {
                    if(await caches.has(_cacheNameVersion))
                    {
                        console.debug(`${logPrefix} ${_cacheNameVersion} already in cache`);
                    }
                    else
                    {
                        console.debug(`${logPrefix} create cache : `, _cacheNameVersion);
                        const cache = await caches.open(_cacheNameVersion);
                        console.debug(`${logPrefix} cache created : `, _cacheNameVersion);
                        await cache.addAll(urls);
                        console.debug(`${logPrefix} added to cache`);
                    }
                    console.info(`${logPrefix} installed`);
                };
            e.waitUntil(install());
        }
    )

    self.addEventListener("fetch",
        e =>
        {
            const request = e.request;
            if(request.url.startsWith(url)
            && urls.includes(request.url))
            {
                console.debug(`${logPrefix} handle : `, request);
                const promise = caches.match(request, {cacheName: _cacheNameVersion });
                e.respondWith(promise);
            }
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
                            caches.delete(key);
                            console.debug(`${logPrefix} remove old version : `, key);
                        }
                    }
                }
                console.debug(`${logPrefix} old versions removed`);
                console.info(`${logPrefix} ${_cacheNameVersion} activated`);
            }
            e.waitUntil(remove());
        }
    )

}