import namings from "./namings.json" with { type: "json" };
import config from "alt-routing/config.json" with { type: "json" };
import baseComposition from "alt-routing/composition.json" with { type: "json" };
import trustedTypesPolicy from "./trustedTypes.js";
console.debug("base composition : ", baseComposition)
console.info("alt-routing module init : route");

export default class Route extends HTMLElement
{
    #internals;

    //config
    #isBaseRoute;

    //promises
    #composeReady = Promise.withResolvers();
    #routingReady = Promise.withResolvers();
    
    //attr
    #path;
    #url;
    #router;

    #_locationMatch;
    #_state;
    #_ok;
    #_method;

    get composeReady()
    {
        return this.#composeReady.promise;
    }
    get routingReady()
    {
        return this.#routingReady.promise;
    }

    //private getters&setters
    get #locationMatch()
    {
        return this.#_locationMatch;
    }
    set #locationMatch(locationMatch) 
    {
        const lm = namings.enums.locationMatch;
        let openBefore = this.#_locationMatch != lm.none ? namings.enums.states.open : null;
        let currentBefore = this.#_locationMatch == lm.exact ? namings.enums.states.current : null;
        this.#_locationMatch = locationMatch;
        let openAfter = this.#_locationMatch != lm.none ? namings.enums.states.open : null;
        let currentAfter = this.#_locationMatch == lm.exact ? namings.enums.states.current : null;
        this.#replaceCustomStateCSS(openBefore, openAfter);
        this.#replaceCustomStateCSS(currentBefore, currentAfter);
    }

    get #ok()
    {
        return this.#_ok;
    }
    set #ok(ok)
    {
        if(this.#_ok !== ok)
        {
            
            const oldOk = this.#_ok ? namings.enums.states.ok : null;
            this.#_ok = ok;
            const newOk = this.#_ok ? namings.enums.states.ok : null;
            
            this.#replaceCustomStateCSS(oldOk, newOk);
        }
    }

    get #method()
    {
        return this.#_method;
    }
    set #method(method) 
    {
        this.#replaceCustomStateCSS(this.#_method, method);
        this.#_method = method;
    }

    //public getters
    get locationMatch()
    {
        return this.#_locationMatch;
    }

    get state()
    {
        return this.#_state;
    }

    get url()
    {
        return this.#url;
    }
    get absolutePath()
    {
        return this.#url.pathname;
    }

    get router()
    {
        return this.#router;
    }

    get method()
    {
        return this.#_method;
    }
    
    //callbacks
    connectedCallback()
    {
        this.#internals = this.attachInternals();
        
        this.#path = this.getAttribute("path");
        if(!this.#path) console.error(`path is not set in`, this);
        this.#isBaseRoute = this.#path.startsWith('/');//toDo check si suffisant
        //init attributes

        if(this.#isBaseRoute)
        {
            this.addEventListener(namings.events.connectComponent,
                this.#routerConstructionEventListener,
                {
                    capture: true
                }
            );
        }

        this.addEventListener(namings.events.connectComponent,
            this.#constructionEventListener,
            {
                capture: true
            }
        );

        this.addEventListener(namings.events.connectComponent,
            this.#connectionEventListener,
            {
                once: true
            }
        );

        this.dispatchEvent(
            new CustomEvent(namings.events.connectComponent,
                {
                    detail: {}//must be initialized
                }
            )
        );
    }

    disconnectedCallback()
    {
        this.#router.removeEventListener(namings.events.navigate, this.updateLocationMatch);
        this.dispatchEvent(namings.events.disconnectComponent);
    }

    async update(navigateEvent)
    {
        //attach callback to navigate
        console.debug(`${this.#url} will try to update`);
        let match = this.#getLocationMatch(navigateEvent);
        this.#locationMatch = match;

        const composition = await this.composeReady;
        const fragmentsNames = composition.fragments;
        const fragmentsModels = composition.models;

        const fragmentsUpdated = [];
        for(const name of fragmentsNames)
        {
            
            const model = fragmentsModels[name];
            const isStatic = model.static;
            const navigation = navigateEvent != null;
            const update = !(isStatic && navigation);
            
            if(update)
            {
                const show = isStatic || model.loading.includes(match);
                if(show)
                {
                    fragmentsUpdated.push(this.loadFragment(name, navigateEvent));
                }
                else
                {
                    fragmentsUpdated.push(this.unloadFragment(name));
                }
            }
        }
        await Promise.all(fragmentsUpdated);  

        await this.loaded(navigateEvent);

    }

    async #precommitAction(controller, navigateEvent)
    {
        const fetchPromise = this.fetchFragment(namings.files.content, navigateEvent);
        navigateEvent.altRouting.contentPromise = fetchPromise;
        const response = await fetchPromise;

        debugger
        if(response.redirected)
        {
            const destinationUrl = this.redirectUrlFromContentUrl(new URL(response.url));
            const redirectOptions = 
                {
                    history: "replace"
                };
            controller.redirect(destinationUrl, redirectOptions);
        }
    }

    async loaded(navigateEvent)
    {
        
        //loaded Event
        const loaded = Promise.withResolvers();
        
        this.addEventListener(namings.events.loaded, e =>
            {
                e.stopPropagation();
                loaded.resolve();
            },
            {
                once: true,
                signal: navigateEvent?.signal 
            }
        );

        const target = this.shadowRoot ?? this;
        
        await this.routingReady;

        target.dispatchEvent(new CustomEvent(namings.events.loaded,
            {
                bubbles: true,
                composed: true
            }
        ));
        await loaded.promise;
    }

    #getLocationMatch(navigateEvent)
    {
        let match = namings.enums.locationMatch.none;
        const url = new URL(navigateEvent?.destination.url ?? location.href);
        //toDo try opti
        if(url.pathname.startsWith(this.#url.pathname))
        {
            if(url.pathname === this.#url.pathname)
            {
                match = namings.enums.locationMatch.exact;
            }
            else
            {
                match = namings.enums.locationMatch.part;
            }
        }
        return match;
    }
    async loadFragment(fragmentName, navigateEvent)//optionnal param
    {
        const url = new URL(navigateEvent?.destination.url ?? location.href);
        const isMainRoute = this.#url.pathname === url.pathname;
        const canPrefetch = isMainRoute && (fragmentName === namings.files.content);
        const prefetchPromise = canPrefetch ? navigateEvent?.altRouting.contentPromise : undefined;
            console.log("preco", (await prefetchPromise), fragmentName)
debugger
        const fragmentPromise = prefetchPromise ?? this.fetchFragment(fragmentName, navigateEvent);
        const fragmentResponse = await fragmentPromise;
        
        
        

        //redirect post commit if no precommithandler
        if(fragmentName === namings.files.content)
        {
            const redirect = isMainRoute && fragmentResponse.redirected && !prefetchPromise;
            if(redirect)
            {
                const contentUrl = new URL(fragmentResponse.url);
                const destinationUrl = this.redirectUrlFromContentUrl(contentUrl);

                //create indépendant response
                const buffer = await fragmentResponse.arrayBuffer();
                const cachedResponse = new Response(buffer, 
                    {
                        headers: fragmentResponse.headers,
                        status: fragmentResponse.status,
                        statusText: fragmentResponse.statusText,
                    }
                );
                const altRouting = {...navigateEvent.altRouting};
                delete altRouting.update;
                const navigateOptions = 
                {
                    info: 
                    {
                        altRouting
                        /*altRouting: 
                        {
                            prenavContentPromise: Promise.resolve(cachedResponse),//to avoid main fetch twice
                            viewTransistion: undefined //toDo keep the same view transition alive
                        }*/
                    },
                    history: "replace"
                };

                navigation.navigate(destinationUrl,navigateOptions);
            }
            //toDo redirect with responsePromise as info
        }
        const insert = true;//toDo add 304 simulation handler
        if(insert)
        {
            const html = await fragmentResponse.text();

            const trusted_html = trustedTypesPolicy?.createHTML(html, this.absolutePath, fragmentName);

            await this.#insertFragment(fragmentName, trusted_html ?? html);

            if(fragmentName === namings.files.content)
            {
                //toDo redirect if necessary
                this.#ok = fragmentResponse.ok;
                
                if(isMainRoute)
                {
                    this.#method = 
                    (
                        fragmentName === namings.files.content 
                        && navigateEvent?.formData
                    ) ? "post" : "get";
                }
            }
            if(fragmentName === namings.files.routing)
            {
                const promises = [];
                for(const route of this.querySelectorAll(":scope>alt-route"))
                {
                    promises.push(route.routingReady);
                }
                this.#routingReady.resolve(Promise.all(promises));
            }
        }
    }

    redirectUrlFromContentUrl(contentUrl)
    {
        const contentPathname = contentUrl.pathname;
        const destinationPathname = contentPathname.replace(new RegExp(RegExp.escape(namings.files.content) + "$"), "");
        const destinationUrl = contentUrl;
        destinationUrl.pathname = destinationPathname;
        return destinationUrl;
    }

    async fetchFragment(fragmentName, navigateEvent)
    {
        
        //request setup
        const url = new URL(navigateEvent?.destination.url ?? location.href);

        const abortSignal = navigateEvent?.signal;//toDo add pageclose signal ? auto abort de base ?
        //toDo check referrer policy
        const referrer = navigation?.transition?.from.url ?? document.referrer;
        //toDo check if locations is already modified 
        const composition = await this.composeReady;
        const model = composition.models[fragmentName];

        const isMainRoute = this.#url.pathname === url.pathname;
        const method = 
        (
            isMainRoute 
            && navigateEvent?.formData 
            && fragmentName === namings.files.content
        ) ? "POST" : "GET";
        const requestInit = 
            {   
                //toDo try not using data added to navigateEvent.altRouting
                //info impossible de gérer le cas ou le premier chargement est un post
                method,
                body: navigateEvent?.formData,
                referrer,
                signal: abortSignal
            };

        const contentURL = new URL(fragmentName, this.#url);

        if(!model.static)
        {
            if(composition.paramFilter)
            {
                for(const param of composition.paramFilter)
                {
                    contentURL.searchParams.append(param, url.searchParams.get(param));
                }
            }
            else
            {
                contentURL.search = url.search;
            }
            
        }
        const contentRequest = new Request(contentURL, requestInit);
        const response = await fetch(contentRequest);
        //if(fragmentName == namings.files.content) debugger

        return response;
    }


    //state listeners
    //onLoaded
    async #insertFragment(name, html)
    {
        const composition = await this.composeReady;
        
        await this.#removeFragment(name);

        const range = composition.ranges[name];

        const template = document.createElement('template');
        template.setHTMLUnsafe(html);
        range.insertNode(template.content);
    }


    async unloadFragment(fragmentName)
    {
        await this.#removeFragment(fragmentName);

        if(fragmentName === namings.files.content)
        {
            this.#ok = null;
            this.#method = null;
        }
    }
    
    //onUnloaded
    async #removeFragment(name)
    {
        console.debug( `remove frament : ${name} from route `, this);
        const composition = await this.composeReady;

        const range = composition.ranges[name];

        range.deleteContents();
    }

    //methods
    #routerConstructionEventListener = (e) => 
    {
        e.detail.url = new URL(location.origin);
    };

    #constructionEventListener = (e) => 
    {
        e.detail.url = new URL(this.#path, e.detail.url);
    };

    #connectionEventListener = (e) => 
    {
        
        this.#url = e.detail.url;
        this.dataset.absolutePath = this.#url.pathname;
        this.#router = e.detail.router;

        this.#router.addEventListener(namings.events.navigate,
            this.update());//bad !

        this.#initComposition();

        //listen navigate event
        if(navigation)
        {
            console.debug("init navigation event");
            navigation?.addEventListener("navigate", this.#navigateEventListener);
        }
    };

    async #initComposition()
    {
        let composition = structuredClone(baseComposition);
        //toDo try catch ?
        const localCompositionModule = 
            config.route.localComposition ? 
            await import(new URL("composition.json", this.#url),{ with: { type: "json" } }): null;
        const localComposition = localCompositionModule?.default;
            
        if(localComposition)
        {
            //merge models
            composition.models = {...composition.models, ...localComposition.models};
            delete localComposition.models;
            composition = {...composition, ...localComposition};
        }
        if(!composition.fragments.includes(namings.files.content))
        {
            throw new Error(`Cannot find "${namings.files.content}" fragment in ${this} composition`);
        }
        if(!composition.models[namings.files.content].loading.includes("exact"))
        {
            throw new Error(`"${namings.files.content}" model must load on exact in ${this} composition`);
        }
        if(!composition.fragments.includes(namings.files.routing))
        {
            this.#routingReady.resolve();
        }
        const templateModel = composition.models[namings.files.template];
        if(templateModel && !templateModel?.static)
        {
            throw new Error(`"${namings.files.template}" fragment must be static in ${this} composition`);
        }
        for(const fragment of composition.fragments)
        {
            if(!composition.models[fragment])
            {
                throw new Error(`Cannot find model for fragment "${fragment}" in ${this} composition`);
            }
        }
        //toDo get composition and merger

        composition.ranges = {};

        for(const framentName of composition.fragments)
        {
            const fragmentTag = document.createComment(framentName);
            this.appendChild(fragmentTag);

            const range = new Range();
            composition.ranges[framentName] = range;
            range.setStartAfter(fragmentTag);
        }
        this.#composeReady.resolve(composition);

    }

    #navigateEventListener = (navigateEvent) =>
    {
        if(navigateEvent?.altRouting.update)
        {
            const handler = async _ =>
            {
                await this.update(navigateEvent);
            };

            const url = new URL(navigateEvent?.destination.url);
            const isMainRoute = this.#url.pathname === url.pathname;
            const prefetch = isMainRoute && !navigateEvent?.info?.altRouting?.prenavContentPromise;

            const precommitHandler = prefetch ? async controller =>
            {
                await this.#precommitAction(controller, navigateEvent);
            }:
            undefined;
            navigateEvent.intercept(
                {
                    //precommitHandler,
                    handler
                }
            );
        }
    }
    
    #replaceCustomStateCSS(from, to)
    {
        if(config.route.dataAttribute.state)
        {
            const state = this.dataset.state;
            const stateList = state?.split(/\s+/);
            const stateSet = new Set(stateList);
            if(from)
            {
                stateSet.delete(from);
            }
            if(to)
            {
                stateSet.add(to);
            } 
            this.dataset.state = [...stateSet].join(" ");
        }
        try
        {
            this.#internals.states.delete(`${from}`);
        }
        catch
        {
            this.#internals.states.delete(`--${from}`);
        }
        try
        {
            this.#internals.states.add(`${to}`);
        }
        catch
        {
            this.#internals.states.add(`--${to}`);
        }
    }

}

customElements.define(namings.components.route, Route);
