import namings from "./namings.js";
import config from "alt-routing/config";
import composition from "./composition.json" with { type: "json" };
console .debug("test", composition)
console.info("alt-routing module init : route");

export default class Route extends HTMLElement
{
    #internals;
    //composition
    #composition = composition;

    //config
    #isBaseRoute;
    #localNav;
    #staticNav;
    #propagateStaticNav;

    #initRouting = Promise.withResolvers();

    #locationMatchExact
    #locationMatchPart;
    #locationMatchNone;
    
    //attr
    #path;
    #router;
    #url;

    #_locationMatch;
    #_state;
    #_status;

    get initRoutingPromise()
    {
        return this.#initRouting.promise;
    }

    //private getters&setters
    get #locationMatch()
    {
        return this.#_locationMatch;
    }
    set #locationMatch(locationMatch) 
    {

        if(this.#_locationMatch)
        {
            this.#replaceCustomStateCSS(this.#_locationMatch, locationMatch);
        }
        if(config.route.showAttribute.locationMatch)
        {
            this.dataset.locationMatch = locationMatch;
        }
        this.#_locationMatch = locationMatch;
        
        //loading policy
        /*let locationMatchMode;
        switch(this.#_locationMatch)
        {
            case namings.enums.locationMatch.exact:
                locationMatchMode = this.#locationMatchExact;
            break;
            case namings.enums.locationMatch.part:
                locationMatchMode = this.#locationMatchPart;
            break;
            case namings.enums.locationMatch.none:
                locationMatchMode = this.#locationMatchNone;
            break;
        }
        if(true)
        {
            switch(locationMatchMode)
            {
                case namings.enums.locationMatchType.fresh:
                    //this.#load(location.search);
                    break;
                case namings.enums.locationMatchType.still:
                    if(this.#_state === namings.enums.state.unloading
                        || this.#_state === namings.enums.state.unloaded
                    )
                    {
                        //this.#load(location.search);
                    }
                    break;
                case namings.enums.locationMatchType.hidden:
                        //this.#unload();
                    break;
            }
        }*/
    }

    get #state()
    {
        return this.#_state;
    }
    set #state(state)
    {
        if(this.#_state !== state)
        {
            this.#_state && this.#replaceCustomStateCSS(this.#_state, state)
            if(config.route.showAttribute.state)
            {
                this.dataset.state = state;
            }
            this.#_state = state;
        }
    }
    
    get #status()
    {
        return this.#_status;
    }
    set #status(status)
    {
        if(this.#_status !== status)
        {
            this.#_status && this.#replaceCustomStateCSS(this.#_status, status)
            if(config.route.showAttribute.status)
            {
                this.dataset.status = status;
            }
            this.#_status = status;
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

    get router()
    {
        return this.#router;
    }

    get staticNav()
    {
        return this.#staticNav;
    }
    
    //callbacks
    connectedCallback()
    {
        this.#internals = this.attachInternals();
        this.#state = namings.enums.state.init;
        this.#status = "";
        this.#locationMatch = namings.enums.locationMatch.none;
        
        this.#path = this.dataset.path;
        this.#isBaseRoute = this.#path.startsWith('/');
        //init attributes
        this.#locationMatchExact = this.dataset.locationMatchExact ?? config.route.locationMatchExact;
        this.#locationMatchPart = this.dataset.locationMatchPart ?? config.route.locationMatchPart;
        this.#locationMatchNone = this.dataset.locationMatchNone ?? config.route.locationMatchNone;
        this.#localNav = this.dataset.localNav ?? config.route.localNav;
        if(this.#localNav)
        {
            this.#replaceCustomStateCSS(undefined, "localNav");
        }

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
        //toDo conditionnal loaging
        const fragmentsNames = this.#composition.order;
        const fragmentsModels = this.#composition.models;

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
                    fragmentsUpdated.push(this.load(name,navigateEvent));
                }
                else
                {
                    fragmentsUpdated.push(this.unload(name));
                }
            }
        }
        
        await Promise.all(fragmentsUpdated);
    }

    async load(fragmentsName, navigateEvent)//optionnal param
    {
        if(fragmentsName != "content.html") return //debug


        const contentPromise = this.fetchContent(fragmentsName, navigateEvent);
        //toDo handle post redirect
        //const navPromise = this.fetchNav(navigateEvent);
        const contentResponse = await contentPromise;
        const insert = true;//not if 304
        if(insert)
        {
            this.#status = contentResponse.status;
            this.#insertFragment(fragmentsName, await contentResponse.text());
        }

        //laoded event setup 
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
        
        await this.#initRouting.promise;

        target.dispatchEvent(new CustomEvent(namings.events.loaded,
            {
                bubbles: true,
                composed: true
            }
        ));
        await loaded.promise;
    }

    //toDo replace fetchContent
    async fetchContent(fragmentsName, navigateEvent)
    {
        //request setup
        const abortSignal = navigateEvent?.signal;//toDo add pageclose signal ? auto abort de base ?
        //toDo check referrer policy
        const referrer = navigateEvent?.altRouting.referrer ?? document.referrer
        //toDo check if locations is already modified 
        const model = this.#composition.models[fragmentsName];
        const requestInit = 
            {   
                //toDo try not using data added to navigateEvent.altRouting
                referrer,
                signal: abortSignal,
                redirect: model.canRedirect ? "manual" : "error" //todo check if good idea
            };

        const url = new URL(navigateEvent?.destination.url ?? location.href);
        
        const contentURL = new URL(fragmentsName, this.#url);

        if(model.useSearchParam)
        {
            contentURL.search = url.search;
        }
        const contentRequest = new Request(contentURL, requestInit);
        const response = await fetch(contentRequest);

        return response;
    }
    
    async fetchNav(navigateEvent)
    {
        //request setup
        const abortSignal = navigateEvent?.signal;//toDo add pageclose signal ? auto abort de base ?
        //toDo check referrer policy
        const referrer = navigateEvent?.altRouting.referrer ?? document.referrer
        //toDo check if locations is already modified 
        const requestInit = 
            {   
                //toDo try not using data added to navigateEvent.altRouting
                referrer,
                signal: abortSignal,
                redirect: "error"//toDo try and 
            };
        
        const navURL = new URL(namings.files.nav, this.#url);
        if(!this.#staticNav)
        {
            const destination = new URL(navigateEvent?.destination.url ?? location.href);
            navURL.search = destination.search;
        }
        const request = new Request(navURL.href, requestInit);
        const response = await fetch(request);
        return response;
    }

    //state listeners
    //onLoaded
    #insertFragment(name, fragment)
    {
        const composition = this.#composition;
        const models = composition.models;
        const index = composition.order.indexOf(name);
        const prevSelectorsList = [];

        for(const name of composition.order.slice(0, index))
        {
            prevSelectorsList.push(models[name].selector);
        }

        const prevElement = this.querySelector(`:scope>:is(${prevSelectorsList}):last-of-type`);

        this.#removeFragment(name);

        if(prevElement)
        {
            prevElement.insertAdjacentHTML("afterend", fragment);
        }
        else
        {
            this.insertAdjacentHTML("afterbegin",fragment);
        }
    }

    insertNav = (html) =>
    {
        this.insertAdjacentHTML("afterbegin", html);
    }

    insertRouting = (e) =>
    {
        this.insertAdjacentHTML("beforeend", e.detail.routing);
        const routes = this.querySelectorAll(namings.components.route);
        const routesReady = [];
        for(const route of routes)
        {
            routesReady.push(route.#initRouting.promise);
        }
        Promise.all(routesReady)
        .then(()=> this.#initRouting.resolve());

    }

    async unload(fragmentName)
    {
        this.#status = "" ;
        this.#removeFragment(fragmentName);
    }
    
    //onUnloaded
    #removeFragment(name)
    {
        console.debug( `remove frament : ${name} from route `, this);
        const selector = this.#composition.models[name].selector;
        const elementsToRemove = this.querySelectorAll(`:scope>${selector}`)
        for(let elementToRemove of elementsToRemove)
        {
            elementToRemove.remove();
        }
    }

    //methods
    

    #routerConstructionEventListener = (e) => 
    {
        e.detail.url = new URL(location.origin);
    };

    #constructionEventListener = (e) => 
    {
        e.detail.url = new URL(this.#path, e.detail.url);
        if(this.#propagateStaticNav != null)
        {
            if(this.#propagateStaticNav)
            {
                e.detail.staticNav = this.#staticNav;
            }
            else
            {
                delete e.detail.staticNav;
            }
        }
    };

    #connectionEventListener = (e) => 
    {
        //init propagatable attributes
        this.#staticNav = this.dataset.staticNav ?? e.detail.staticNav?? config.route.staticNav;
        if(this.#staticNav)
        {
            this.#replaceCustomStateCSS(undefined, "staticNav");
        }
        
        this.#url = e.detail.url;
        this.#router = e.detail.router;

        this.#router.addEventListener(namings.events.navigate,
            this.update());//bad !

        //set selectors to remove on unloading
        this.excludeRemoveSelector = [config.route.routingSelector];
        if(this.#localNav && this.#staticNav)
        {
            this.excludeRemoveSelector.push(config.route.navSelector)
        }
        this.excludeRemoveSelector.push(config.route.routingSelector)

        if(this.#localNav && this.#staticNav) 
        {
            this.addEventListener(namings.events.navLoaded,
                this.insertNav,
                {
                    once: true
                }
            );
            fetch(new URL(namings.files.nav, this.#url))
            .then(response => response.text())
            .then((html) =>
            {
                this.dispatchEvent(
                    new CustomEvent(namings.events.navLoaded,
                        {
                            detail: 
                            {
                                nav: html
                            }
                        }
                    )
                );
            });
        }
        
        this.addEventListener(namings.events.routingLoaded,
            this.insertRouting,
            {
                once: true
            }
        );
        fetch(new URL(namings.files.routing, this.#url))
        .then(response => response.text())
        .then((html) =>
        {
            this.dispatchEvent(
                new CustomEvent(namings.events.routingLoaded,
                    {
                        detail: 
                        {
                            routing: html
                        }
                    }
                )
            );
        });

        this.#state = namings.enums.state.unloaded;

        //listen to route change

        //listen navigate event
        //add router ref to routing components on connection
        if(navigation)
        {
            console.debug("init navigation event");
            navigation?.addEventListener("navigate", this.#navigateEventListener);
        }
    };

    #navigateEventListener = (navigateEvent) =>
    {
        //
        if(navigateEvent.altRouting)
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
