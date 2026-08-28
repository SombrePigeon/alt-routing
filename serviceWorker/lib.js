import version from "./version.json" with { type: "json" };
import namings from "./namings.json" with { type: "json"};
import files from "./libFiles.json" with { type: "json"};

const logPrefix = "[SW::alt-routing::lib]";

const baseUrl = new URL("../", import.meta.url);

export function init(cacheName = namings.caches.lib)
{
    const cacheNameVersion = `${cacheName}/${version}`;
    console.info(`${logPrefix} starting ... `);
    console.info(`${logPrefix} version : `, version);
    console.debug(`${logPrefix} cacheName : `, cacheNameVersion);

    self.addEventListener("install",
        e =>
        {
            console.info(`${logPrefix} install version : ${version}`);

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

                        const urls = files.map(file => new URL(file, baseUrl).href);
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
                for(const key of cacheKeys)
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
            };
            e.waitUntil(remove());
        }
    )
}