const logPrefix = "[SW::alt-routing-routing]";
let _cacheName;
let _cacheNameVersion;
const url = new URL("../", import.meta.url);

const routes = [
    "/"
];

let urls;
let urlsSet;

export function init(routes, config, version, composition, cacheName)
{
    _cacheName = cacheName ?? "alt-routing-routing";
    _cacheNameVersion = `${_cacheName}/${version}`;
    console.debug(`${logPrefix} version : `, version);
    console.debug(`${logPrefix} cacheName : `, _cacheNameVersion);

    self.addEventListener("install",
        e =>
        {
            console.info(`${logPrefix} install version : ${version}`);
            urlsSet = new Set();

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
                        const promises = [];
                        //get composition
                        const compositionPath = composition ?? "../composition.json";
                        await cache.add(compositionPath);
                        const baseComposition = await cache.match(compositionPath, {cacheName: _cacheNameVersion });
                        for(const route of routes)
                        {
                            let composition = baseComposition;
                            if(config.route.localComposition)
                            {
                                //get composition
                                //add to urlset
                                //merge compositions
                            }
                            for(const fragment of fragments)
                            {
                                //if static, add
                            }
                            //list static fragments
                            //add to cache and urlset
                        }
                        //old await cache.addAll(urls);
                        await Promise.all(promises);
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
            if(urlsSet.has(request.url))
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
            remove();
        }
    )

}