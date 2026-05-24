import version from "./version.json" with {type : "json"};

const logPrefix = "[SW::alt-routing]";
let _cacheName;
let _cacheNameVersion;
const url = new URL("./",import.meta.url);

export function install(cacheName)
{
    _cacheName = cacheName ?? "alt-routing";
    _cacheNameVersion = `${_cacheName}/${version}`;

    console.debug(`${logPrefix} url : `, url.href);
    console.debug(`${logPrefix} version : `,version);
    console.debug(`${logPrefix} cacheName : `, _cacheNameVersion);

    self.addEventListener("install",
        e =>
        {
            //get version and store it in cache
            e.waitUntil(
                async _ =>
                {
                    caches.delete(url)
                    const cache = await caches.open(cacheNameVersion);
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
                    const urls = files.map(file => new URL(file, url));
                    await cache.addAll(urls);
                    console.debug(`${logPrefix} url en cache : `, urls);
                }
            )
        }
    )

    self.addEventListener("fetch",
        e =>
        {
            const request = e.request;
            if(request.url.startsWith(url))
            {
                const promise = caches.match(request);
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
                console.info(`${logPrefix} activated`);
            }
            e.waitUntil(remove);
        }
    )

}