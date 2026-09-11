import libVersion from "./version.json" with { type: "json" };
import namings from "./namings.json" with { type: "json"};

const logPrefix = "[SW::alt-routing::routing]";

//toDo link to version of alt-routing to update  
export function install(routes, config, routingVersion, compositionPath = `../${namings.files.composition}`,
     baseUrl = new URL("../", import.meta.url), cacheName = namings.caches.routing)
{
    let cacheNameVersion = `${cacheName}/${libVersion}/${routingVersion}`;
    console.info(`${logPrefix} starting ... `);
    console.info(`${logPrefix} version : `, routingVersion);
    console.debug(`${logPrefix} cacheName : `, cacheNameVersion);

    self.addEventListener("install",
        e =>
        {
            console.info(`${logPrefix} install version : ${routingVersion}`);

            const install = async _ =>
                {
                    if(await caches.has(cacheNameVersion))
                    {
                        console.debug(`${logPrefix} ${cacheNameVersion} already installed`);
                    }
                    else
                    {
                        console.debug(`${logPrefix} create cache : `, cacheNameVersion);
                        const cache = await caches.open(cacheNameVersion);
                        console.debug(`${logPrefix} cache created : `, cacheNameVersion);
                        const promises = [];
                        //get composition
                        const compositionUrl = new URL(compositionPath, baseUrl);
                        //toDo use default arg, from lib or base url
                        console.debug(`${logPrefix} add base composition : `, compositionUrl.href);
                        const baseCompositionPromise =  cache.add(compositionUrl).then( _ => cache.match(compositionUrl));

                        console.debug(`${logPrefix} install routes : `, routes);
                        for(const route of routes)
                        {
                            const absolutePath = new URL(route, baseUrl);
                            promises.push(installRoute(absolutePath, config, baseCompositionPromise, cache));
                        }
                        await Promise.all(promises);
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
                    if(key.startsWith(`${cacheName}/`))
                    {
                        if(key !== cacheNameVersion)
                        {
                            await caches.delete(key);
                            console.debug(`${logPrefix} remove old version : `, key);
                        }
                    }
                }
                console.debug(`${logPrefix} old versions removed`);
                console.info(`${logPrefix} ${cacheNameVersion} activated`);
            }
            e.waitUntil(remove());
        }
    )

}

async function installRoute(absolutePath, config, baseCompositionPromise, cache)
{
    const logPrefixRoute = `${logPrefix} "${absolutePath}" :`;
    let localCompositionPromise;
    const url = absolutePath;
    
    console.debug(`${logPrefixRoute} installing`);

    if(config.route.localComposition)
    {
        const localCompositionUrl = new URL(namings.files.composition, url);
        localCompositionPromise = cache.add(localCompositionUrl).then(async _ => (await cache.match(localCompositionUrl)).json());
    }

    const baseCompositionResponse = (await baseCompositionPromise).clone();
    let composition = await baseCompositionResponse.json();
    if(config.route.localComposition)
    {
        const localComposition = await localCompositionPromise;
        console.debug(`${logPrefixRoute} baseComposition : `, composition);
        console.debug(`${logPrefixRoute} localComposition : `, localComposition);
        //merge models
        composition.models = {...composition.models, ...localComposition.models};
        delete localComposition.models;
        composition = {...composition, ...localComposition};
    }
    console.debug(`${logPrefixRoute} composition : `, composition);

    const staticsFragmentsUrls = [];
    for(const fragment of composition.fragments)
    {
        const model = composition.models[fragment];
        console.debug(`${logPrefixRoute} fragment model : `, model);
        if(model.static)
        {
            const fragmentUrl = new URL(fragment, url);
            console.debug(`${logPrefixRoute} add route fragment : `, fragmentUrl.href);
            staticsFragmentsUrls.push(fragmentUrl);
        }
    }
    await cache.addAll(staticsFragmentsUrls)
}

