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
                        console.debug(`${logPrefix} récupération de la composition `);
                        const compositionUrl = new URL(compositionPath, baseUrl);//toDo use default arg, from lib or base url
                        
                        console.debug(`${logPrefix} base composition : `, compositionUrl.href);
                        const baseCompositionPromise =  cache.add(compositionUrl).then( _ => cache.match(compositionUrl));

                        console.debug(`${logPrefix} routes à mettre en cache`, routes);
                        for(const route of routes)
                        {
                            promises.push(installRoute(route, config, baseCompositionPromise, baseUrl, cache));
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

async function installRoute(path, config, baseCompositionPromise, baseUrl, cache)
{
    //override logPrefix ?
    let localComposition;
    const url = new URL(path, baseUrl);
    console.debug(`${logPrefix} mise en cache de l'url : ${url}` );
    //if local get local
    //await les deux et après merge si pas null
    if(config.route.localComposition)
    {
        const localCompositionUrl = new URL(namings.files.composition, url);
        await cache.add(localCompositionUrl);
        localComposition = await (await cache.match(localCompositionUrl)).json();
    }

    const response = (await baseCompositionPromise).clone();
    let composition = await response.json();
    console.debug(`${logPrefix} base composition : `, composition);
    console.debug(`${logPrefix} composition locale : `, localComposition);
    if(config.route.localComposition)
    {
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
        }
    }
    await cache.addAll(staticsFragmentsUrls)
}

