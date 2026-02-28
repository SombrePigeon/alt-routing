import namings from "./namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : route");

export default class Route extends HTMLElement
{
    #internals;

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
        let locationMatchMode;
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
        }
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

    async updateContent(navigateEvent)
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
        let retPromise;
        switch(match)
        {
            case namings.enums.locationMatch.exact:
                retPromise = this.load(navigateEvent);
            break;
            case namings.enums.locationMatch.part:
                retPromise = this.load(navigateEvent);
            break;
            case namings.enums.locationMatch.none:
                retPromise = this.unload();
            break;
        }
        await retPromise;
    }

    async load(navigateEvent)//optionnal param
    {
        const responses = await this.fetch(navigateEvent);//or the one in event (beta)
        this.insertContent(responses);

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

    fetch(navigateEvent)
    {
        //request setup
        const abortSignal = navigateEvent?.signal;//toDo add pageclose signal
        const referrer = navigateEvent?.altRouting.referrer ?? document.referrer
        //toDo check if locations is already modified 
        const requestInit = 
            {   
                //toDo try not using data added to navigateEvent.altRouting
                referrer,
                signal: abortSignal
            };

        const url = new URL(navigateEvent?.destination.url ?? location.href);
        const navURL = new URL(namings.files.nav, this.#url);
        navURL.search = url.search;
        const navRequest = new Request(navURL.href, requestInit);
        const navPromise = (this.#localNav && !this.#staticNav) ?
            fetch(navRequest)
            .then((response) =>
                {
                    return response.text();
                }
            ) : Promise.resolve();

        const contentURL = new URL(namings.files.content, this.#url);
        contentURL.search = url.search;
        const contentRequest = new Request(contentURL, requestInit);
        const contentPromise = 
            fetch(contentRequest)
            .then((response) =>
                {
                    return Promise.all([response.text(),Promise.resolve(response.status)]);
                })
            .then(promises =>
                {
                    const result = 
                    {
                        html: promises[0],
                        status: promises[1]
                    }
                    return result;
                }
            );

        const allPromise = Promise.all([navPromise, contentPromise]);
        return allPromise;
    }

    //state listeners
    //onLoaded
    insertContent = (promise) =>
    {

        const nav = promise[0];
        const content = promise[1].html;
        const status = promise[1].status;
        //remove old content 
        this.#removeContent();

        if(this.#localNav && !this.#staticNav)
        {
            this.insertNav(nav);
        }
        
        //content after because it's after in static routing too
        const routingFirstElement = this.querySelector(`${config.route.routingSelector}:first-of-type`);
        
        if(routingFirstElement)
        {
            routingFirstElement.insertAdjacentHTML("beforebegin", content);
        }
        else
        {
            this.insertAdjacentHTML("beforeend", content);
        }

        this.#status = status;
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

    async unload()
    {
        this.#removeContent();
    }
    
    //onUnloaded
    #removeContent()
    {
        console.debug(this, "remove content")
        this.#status = "";
        let elementsToRemove = this.querySelectorAll(`:scope>*:not(:is(${this.excludeRemoveSelector}))`)
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
            this.updateContent());//bad !

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
                await this.updateContent(navigateEvent)
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
