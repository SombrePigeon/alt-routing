const logPrefix = "[SW::alt-routing-routing]";
let _cacheName;
let _cacheNameVersion;
const url = new URL("../", import.meta.url);

const routes = [
    "/"
];

let urls;
let urlsSet = new Set();

export function install(routes, config, version, composition, baseUrl = import.meta.url, cacheName, namings)
{
    _cacheName = cacheName ?? "alt-routing-routing";
    _cacheNameVersion = `${_cacheName}/${version}`;
    console.debug(`${logPrefix} version : `, version);
    console.debug(`${logPrefix} cacheName : `, _cacheNameVersion);

    self.addEventListener("install",
        e =>
        {
            console.info(`${logPrefix} install version : ${version}`);

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
                        console.debug(`${logPrefix} récupération de la composition `);
                        const compositionPath = composition ?? "../composition.json";//get from lib caches
                        console.debug(`${logPrefix} baseurl : `, baseUrl);
                        const compositionUrl = new URL(compositionPath, baseUrl);
                        
                        console.debug(`${logPrefix} cache composition : `, compositionUrl.href);
                        await cache.add(compositionUrl);
                        urlsSet.add(compositionUrl);
                        const baseComposition = await cache.match(compositionUrl);

                        console.debug(`${logPrefix} routes à mettre en cache`, routes);
                        for(const route of routes)
                        {
                            promises.push(installRoute(route, config, compositionUrl, baseUrl));
                        }
                        await Promise.all(promises);
                        console.debug(`${logPrefix} added to cache`);
                    }
                    console.info(`${logPrefix} installed`);
                };
            e.waitUntil(install());
        }
    )
/*
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
*/
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

async function installRoute(path, config, baseComposition, baseUrl )
{
    const cache = await caches.open(_cacheNameVersion);
    let composition =  await (await cache.match(baseComposition)).json();
    const url = new URL(path, baseUrl);
    console.debug(`${logPrefix} mise en cache de l'url : ${url}` );
    console.debug(`${logPrefix} base composition : `, composition);

    if(config.route.localComposition)
    {
        const compositionUrl = new URL("composition.json", url);
        urlsSet.add(compositionUrl.href);
        await cache.add(compositionUrl);
        const localComposition = await (await cache.match(compositionUrl)).json();
        console.debug(`${logPrefix} composition locale : `, localComposition);
        //merge models
        composition.models = {...composition.models, ...localComposition.models};
        delete localComposition.models;
        composition = {...composition, ...localComposition};
    }
    console.debug(`${logPrefix} composition mergée: `, composition);
    const staticsFragmentsUrls = [];
    for(const fragment of composition.fragments)
    {
        const model = composition.models[fragment];
        console.debug(`${logPrefix} fragment : `,model);
        if(model.static)
        {
            const fragmentUrl = new URL(fragment, url);
            console.debug(`${logPrefix} add fragment url: `, fragmentUrl);
            staticsFragmentsUrls.push(fragmentUrl);
            urlsSet.add(fragmentUrl.href);
        }
    }
    await cache.addAll(staticsFragmentsUrls)
}

