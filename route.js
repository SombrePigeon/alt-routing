import namings from "./namings.js";
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
    #_status;
    #_ok;

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
        let openBefore = this.#_locationMatch != lm.none ? "open" : null;
        let currentBefore = this.#_locationMatch == lm.exact ? "current" : null;
        this.#_locationMatch = locationMatch;
        let openAfter = this.#_locationMatch != lm.none ? "open" : null;
        let currentAfter = this.#_locationMatch == lm.exact ? "current" : null;
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
            
            const oldOk = this.#_ok ? "ok" : null;
            this.#_ok = ok;
            const newOk = this.#_ok ? "ok" : null;
            
            this.#replaceCustomStateCSS(oldOk, newOk);
        }
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

    get status()
    {
        return this.#_status;
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

    async loadFragment(fragmentsName, navigateEvent)//optionnal param
    {
        const fragmentPromise = this.fetchFragment(fragmentsName, navigateEvent);
        //toDo handle post redirect
        const fragmentResponse = await fragmentPromise;
        const insert = true;//toDo add 304 simulation handler
        if(insert)
        {
            const html = await fragmentResponse.text();

            const trusted_html = trustedTypesPolicy?.createHTML(html, this.absolutePath, fragmentsName);

            await this.#insertFragment(fragmentsName, trusted_html ?? html);

            if(fragmentsName === "content.html")
            {
                //toDo redirect if necessary
                this.#ok = fragmentResponse.ok;
                const url = new URL(navigateEvent?.destination.url ?? location.href);
                const isMainRoute = this.#url.pathname === url.pathname;
                if(isMainRoute && navigateEvent?.formData)//toDo detectPost (main + formData) add remove on unload (setmethod)
                {
                    //state post
                }
                else
                {
                    //state get
                }
            }
            if(fragmentsName === "routing.html")
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

    async fetchFragment(fragmentsName, navigateEvent)
    {
        
        //request setup
        const url = new URL(navigateEvent?.destination.url ?? location.href);

        const abortSignal = navigateEvent?.signal;//toDo add pageclose signal ? auto abort de base ?
        //toDo check referrer policy
        const referrer = navigation?.transition?.from.url ?? document.referrer;
        //toDo check if locations is already modified 
        const composition = await this.composeReady;
        const model = composition.models[fragmentsName];

        const isMainRoute = this.#url.pathname === url.pathname;
        const requestInit = 
            {   
                //toDo try not using data added to navigateEvent.altRouting
                //info impossible de gérer le cas ou le premier chargement est un post
                method: (isMainRoute && navigateEvent?.formData) ? "POST" : "GET",
                body: navigateEvent?.formData,
                referrer,
                signal: abortSignal,
                redirect: fragmentsName == "content.html" ? "manual" : "error" //todo check if good idea
            };

        const contentURL = new URL(fragmentsName, this.#url);

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
        //if(fragmentsName == "content.html") debugger

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
        this.#ok = null;
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
        if(!composition.fragments.includes("content.html"))
        {
            throw new Error(`Cannot find "content.html" fragment in ${this} composition`);
        }
        if(!composition.models["content.html"].loading.includes("exact"))
        {
            throw new Error(`"content.html" model must load on exact in ${this} composition`);
        }
        if(!composition.fragments.includes("routing.html"))
        {
            this.#routingReady.resolve();
        }
        const templateModel = composition.models["template.html"];
        if(templateModel && !templateModel?.static)
        {
            throw new Error(`"template.html" fragment must be static in ${this} composition`);
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
                await this.update(navigateEvent)
            }
            navigateEvent.intercept(
                {
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
