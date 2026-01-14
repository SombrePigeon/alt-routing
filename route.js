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

    #locationMatchExact
    #locationMatchPart;
    #locationMatchNone;
    
    //attr
    #path;
    #router;
    #url;
    #abortController;
    #lastRoute

    #_locationMatch;
    #_state;
    #_status;

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
        if(!this.popover)
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
    
    #closepopoverListener = (e) =>
    {
        if(e.newState === "closed")
        {
            const prevLink = this.querySelector(`:scope a[rel~="prev"]:not(${config.route.routingSelector} *)`);
            prevLink?.click();
        }
    }

    #updateContent = (e) =>
    {
        const update = this.popover
        || (!this.popover && !e.detail.popover)
        || e.detail.type === "initial";

        if(update)
        {
            //attach callback to navigate
            console.debug(`${this.#url} will try to update`);
            let match = namings.enums.locationMatch.none;
            const location = e.detail.url;
            //toDo try opti
            if(location.pathname.startsWith(this.#url.pathname))
            {
                if(location.pathname === this.#url.pathname)
                {
                    match = namings.enums.locationMatch.exact;
                }
                else
                {
                    match = namings.enums.locationMatch.part;
                }
            }

            //loading policy
            let locationMatchMode;
            switch(match)
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
            //action to do
            switch(locationMatchMode)
            {
                case namings.enums.locationMatchType.fresh:
                    this.#load(e);
                    break;
                case namings.enums.locationMatchType.still:
                    if(this.#_state === namings.enums.state.unloading
                        || this.#_state === namings.enums.state.unloaded
                    )
                    {
                        this.#load(e);
                    }
                    break;
                case namings.enums.locationMatchType.hidden:
                        this.#unload(e);
                    break;
            }
        }
    }

    load(navigationEvent)//optionnal param
    {
        const fetchPromise = this.fetch(navigationEvent);

        const canWrite = Promise.all([fetchPromise, navigationEvent?.altRouting.writeDom.promise]);
        let writen = canWrite.then(this.insertContent);
        if(this.popover)
        {
            writen = writen.then(e => 
                {
                    this.showPopover({ source: navigationEvent?.sourceElement});
                }
            );
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
                signal: navigationEvent?.abortSignal 
            }
        );

        const target = this.shadowRoot ?? this;
        writen.then(e => 
            {
                target.dispatchEvent(new CustomEvent(namings.events.loaded,
                    {
                        bubbles: true,
                        composed: true
                    }
                ));
            }
        );
        
        navigationEvent?.altRouting.domChanges.push(loaded.promise);
        /*
        const handler =
            async _ =>
            {

            }

        navigationEvent?.intercept(
            {
                handler
            }
        );*/
    }

    fetch(navigationEvent)
    {
        //request setup
        const abortSignal = navigationEvent?.signal;
        const referrer = navigationEvent?.altRouting.referrer ?? document.referrer
        //toDo check if locations is already modified 
        const requestInit = 
            {   
                //toDo try not using data added to navigateEvent.altRouting
                referrer,
                signal: abortSignal
            };

        const url = navigationEvent?.destination.url ?? new URL(location.href);

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
        debugger
        const contentPromise = 
            fetch(contentRequest)
            .then((response) =>
                {
                    this.#status = response.status;
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
                });
            
            const allPromise = Promise.all([navPromise, contentPromise]);
            return allPromise;
    }
    
    #load = (routingEvent) =>
    {
        //write on dom when routeur resolve
        const fetchPromise = this.fetchContent(routingEvent);
        const source = routingEvent.detail.source;
        const canWrite = Promise.all([fetchPromise, routingEvent.detail.writeDom.promise]);
        let writen = canWrite.then(this.insertContent);
        if(this.popover)
        {
            writen = writen.then(e => 
                {
                    this.showPopover({ source: source});
                }
            );
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
                signal: routingEvent.abortSignal //what if no navigation ?
            }
        );

        const target = this.shadowRoot ?? this;
        writen.then(e => 
            {
                target.dispatchEvent(new CustomEvent(namings.events.loaded,
                    {
                        bubbles: true,
                        composed: true
                    }
                ));
            }
        );
        
        routingEvent.detail.domChanges.push(loaded.promise);
    }
    //state listeners
    //onLoading
    fetchContent = (routingEvent) =>
    {
        //request setup
        const abortSignal = routingEvent.detail.abortSignal;
        const navigationEvent = routingEvent.detail.navigation;
        //toDo check if locations is already modified 
        const requestInit = 
            {   
                referrer: routingEvent.detail.referrer,
                signal: abortSignal
            };

        const url = navigationEvent ? navigationEvent.destination.url : location.href;
        const navURL = new URL(namings.files.nav, this.#url);
        navURL.search = routingEvent.detail.url.search;
        const navRequest = new Request(navURL.href, requestInit);
        const navPromise = (this.#localNav && !this.#staticNav) ?
            fetch(navRequest)
            .then((response) =>
                {
                    return response.text();
                }
            ) : Promise.resolve();

        const contentURL = new URL(namings.files.content, this.#url);
        contentURL.search = routingEvent.detail.url.search;
        const contentRequest = new Request(contentURL, requestInit);
        const contentPromise = 
            fetch(contentRequest)
            .then((response) =>
                {
                    this.#status = response.status;
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
                });
            
            const allPromise = Promise.all([navPromise, contentPromise]);
            return allPromise;
            
    }
    
    //onLoaded
    insertContent = (promise) =>
    {
        const nav = promise[0][0];
        const content = promise[0][1].html;
        const status = promise[0][1].status;

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
            const {promise, resolve} = Promise.withResolvers();
            routesReady.push(promise);
            route.addEventListener(namings.events.routingReady,
                ()=>
                {
                    resolve();
                },
                {
                    once: true
                }
            );
        }
        Promise.all(routesReady)
        .then(()=> this.dispatchEvent(new CustomEvent(namings.events.routingReady)));

    }

    #unload = (navigation) =>
    {
        //write on dom when routeur resolve
        const canWrite = navigation.detail.writeDom.promise;
        let removed = canWrite.then(this.#removeContent);
        if(this.popover)
        {
            removed = removed.then(e => 
            {
                this.hidePopover();
            })
        }
        navigation.detail.domChanges.push(removed);
    }
    
    //onUnloading
    #onUnloading = (e) =>
    {
        //noop
        this.dispatchEvent(new CustomEvent(namings.events.unloaded));
    }
    //onUnloaded
    #removeContent = (e) =>
    {
        this.#status = "";
        let elementsToRemove = this.querySelectorAll(`:scope>*:not(:is(${this.excludeRemoveSelector}))`)
        for(let elementToRemove of elementsToRemove)
        {
            elementToRemove.remove();
        }
    }

    #onAbort = (e) =>
    {
        e.stopPropagation();
        this.#abortController?.abort();
    }

    //methods
    updateLocationMatch = (e) =>
    {
        let match = namings.enums.locationMatch.none;
        const location = e.detail.url;
        //toDo try opti
        if(location.pathname.startsWith(this.#url.pathname))
        {
            if(location.pathname === this.#url.pathname)
            {
                match = namings.enums.locationMatch.exact;
            }
            else
            {
                match = namings.enums.locationMatch.part;
            }
        }
        if(this.popover)
        {
            //this.hidePopover();
        }
        this.#locationMatch = match;

        if(!this.popover && false)
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

    updateRoutes()
    {
        this.dispatchEvent(new CustomEvent(namings.events.routeChange));
    }

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
        this.#lastRoute =location.href.split('#')[0];
        
        if(this.popover)
        {
            this.#router.addEventListener(namings.events.navigate,
                (e)=>
                {
                    e.detail.popover ||= e.detail.url.pathname.startsWith(this.url.pathname);
                },
                {
                    capture: true
                });
            /*
            this.addEventListener(namings.events.loading,
                ()=> {this.showPopover()});
            this.addEventListener(namings.events.unloaded,
                ()=> {this.hidePopover()});*/
            this.addEventListener("beforetoggle",
                this.#closepopoverListener);
        }

        this.#router.addEventListener(namings.events.navigate,
            this.#updateContent);

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
        //
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
        this.#router.addEventListener(namings.events.navigate,
            this.updateLocationMatch);
    };

    

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
