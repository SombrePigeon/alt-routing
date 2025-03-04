import namings from "./namings.js";
import config from "alt-routing/config";
console.log("route module");

export default class Route extends HTMLElement
{
    #internals;

    //config
    #isRouteur;
    #localNav;
    #staticNav;
    #staticRouting;
    #propagateStaticRouting;
    #loadOnPartMatching;
    
    //attr
    #path;
    #routeur;
    #url;
    #abortController = null;

    #_locationMatch;
    #_state;
    #_status;

    get #locationMatch()
    {
        return this.#_locationMatch;
    }

    set #locationMatch(locationMatch) 
    {
        if(this.#_locationMatch !== locationMatch)
            {
                this.#_locationMatch && this.#replaceCustomStateCSS(this.#_locationMatch, locationMatch);
                this.dataset.locationMatch = Symbol.keyFor(locationMatch);
                this.#_locationMatch = locationMatch;
                console.debug("route", this, ` ${this.#url?.href} locationMatch changed to : ${Symbol.keyFor(locationMatch)}`);

            switch(this.#_locationMatch)
            {
                case namings.enums.locationMatch.part:
                    if(!this.#loadOnPartMatching) break; 
                case namings.enums.locationMatch.exact:
                    switch(this.#state)
                    {
                        case namings.enums.state.unloaded:
                            this.shadowRoot ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.loading, {bubbles: true, composed: true}))
                                : this.dispatchEvent(new CustomEvent(namings.events.loading));
                            break;
                        case namings.enums.state.loaded:
                            break;
                        case namings.enums.state.loading:
                            break;
                        case namings.enums.state.unloading:
                            break;
                    }
                    break;
                case namings.enums.locationMatch.none:
                    switch(this.#state)
                    {
                        case namings.enums.state.unloaded:
                            break;
                        case namings.enums.state.loaded:
                            this.shadowRoot ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.unloading,{bubbles: true, composed: true}))
                                : this.dispatchEvent(new CustomEvent(namings.events.unloading));
                            break;
                        case namings.enums.state.loading:
                            break;
                        case namings.enums.state.unloading:
                            break;
                    }
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
        console.debug(`state for ${this.#url?.pathname} : try change to ${Symbol.keyFor(state)}`);
        this.#url && console.debug("route", this, ` ${this.#url.href} state: ${Symbol.keyFor(state)}`);
        if(this.#_state !== state)
        {
            this.#_state && this.#replaceCustomStateCSS(this.#_state, state)
            this.dataset.state = Symbol.keyFor(state);
            this.#_state = state;
            console.debug("route", this, ` ${this.#url?.pathname} state changed to : ${Symbol.keyFor(state)}`);
        }
    }
    
    get #status()
    {
        return this.#_state;
    }

    set #status(status)
    {
        if(this.#_status !== status)
        {
            this.#_status && this.#replaceCustomStateCSS(this.#_status, status)
            this.dataset.status = Symbol.keyFor(status);
            this.#_status = status;
            console.debug("route", this, ` ${this.#url?.pathname} status changed to : ${Symbol.keyFor(status)}`);
        }
    }

    get url()
    {
        return this.#url;
    }
    
    constructor()
    {
        super();
        this.#internals = this.attachInternals();
        this.#state = namings.enums.state.init;
        this.#status = namings.enums.status.ok;
        this.#locationMatch = namings.enums.locationMatch.none;
    }
    
    //callbacks
    connectedCallback()
    {
        this.#path = this.dataset.path;
        this.#isRouteur = this.#path.startsWith('/');
        this.#propagateStaticRouting = this.dataset.propagateStaticRouting ?? config.route.propagateStaticRouting;
        if(this.#isRouteur)
        {
            console.info(`router alt-route activate`);
            this.addEventListener(namings.events.connectingRoutingComponent,
                this.#routeurConstructionEventListener,
                {
                    capture: true
                }
            );
            //generate navigation event
            ///when popstate event
            window.addEventListener("popstate",
            this.#popstateEventListener);
            ///when click internal navigation
            this.addEventListener(namings.events.navigate,
                this.#navigateEventListener);
            window.addEventListener("message", this.#messageNavigateEventListenner);
        }
        this.addEventListener(namings.events.connectingRoutingComponent,
            this.#constructionEventListener,
            {
                capture: true
            }
        );

        this.addEventListener(namings.events.connectingRoutingComponent,
            this.#connectionEventListener,
            {
                once: true
            }
        );

        ///stateChange events
        //onLoading
        this.addEventListener(namings.events.loading,
            (e) => 
            {
                e.stopPropagation();
                this.#abortController?.abort();
                this.#abortController = new AbortController();
                this.#state = namings.enums.state.loading;
            }
        );
        this.addEventListener(namings.events.loading,
            this.fetchContent
        );
        //onloaded
        this.addEventListener(namings.events.loaded,
            this.insertContent
        );
        this.addEventListener(namings.events.loaded,
            (e) => 
            {
                e.stopPropagation();
                this.#state = namings.enums.state.loaded;
            }
        );
        this.addEventListener(namings.events.loaded,
            this.updateTarget
        );
        //onUnloading
        this.addEventListener(namings.events.unloading,
            (e) => 
            {
                e.stopPropagation();
                this.#abortController?.abort();
                this.#abortController = new AbortController();
                this.#state = namings.enums.state.unloading;
            }
        );
        this.addEventListener(namings.events.unloading,
            this.#onUnloading
        );
        //onUnloaded
        this.addEventListener(namings.events.unloaded,
            (e) => 
            {
                e.stopPropagation();
                this.#state = namings.enums.state.unloaded;
            }
        );
        this.addEventListener(namings.events.unloaded,
            this.#onUnloaded
        );
        //onAbort
        this.addEventListener(namings.events.abort,
            this.#onAbort
        );



        console.log("route is connecting");
        this.dispatchEvent(
            new CustomEvent(namings.events.connectingRoutingComponent,
                {
                    detail: {}//must be initialized
                }
            )
        );
    }

    disconnectedCallback()
    {
        console.log("disconnect" + this.#url);
        //disconnect window eventListenners
        if(this.#isRouteur)
        {
            window.removeEventListener("popstate", this.#popstateEventListener);
            window.removeEventListener("message", this.#messageNavigateEventListenner);
        }
        this.#routeur.removeEventListener(namings.events.routeChange, this.updateLocationMatch);
        this.#routeur.removeEventListener(namings.events.routeChange, this.updateTarget);
    }

    //state listeners
    //onLoading
    fetchContent = (e) =>
    {
        //load data
        const contentAbsolutePath = new URL(namings.files.content, this.#url);

        const abortListener = this.#abortController.signal;

        const navPromise = (this.#localNav && !this.#staticNav) ?
            fetch(new URL(namings.files.nav, this.#url))
            .then((response) =>
            {
                return response.text();
            })
            :
            Promise.resolve();
        

        const contentPromise = fetch(contentAbsolutePath,
            {
                signal: abortListener
            })
            .then((response) =>
            {
                if(response.ok)
                {
                    //toDo status is aborted or http code
                    this.#status = namings.enums.status.ok;
                }
                else
                {
                    this.#status = namings.enums.status.ko;
                }
                return response.text();
            })
            .catch((error) =>
            {
                //toDo something mais koi ...
                this.#state = namings.enums.state.unloaded;
                switch(error.name)
                {
                    case "AbortError":
                        this.#status = namings.enums.status.aborted;
                        break;
                    default:
                        throw error;
                }
            });
            
            const routePromise = (!this.#staticRouting) ?
                fetch(new URL(namings.files.route, this.#url))
                .then((response) =>
                {
                    return response.text();
                })
                :
                Promise.resolve();
                
            const allPromise = Promise.all([navPromise, contentPromise, routePromise])
            .then(promises =>
            {
                this.dispatchEvent(new CustomEvent(namings.events.loaded,
                    {
                        detail : 
                            {
                                nav: promises[0],
                                content: promises[1],
                                route: promises[2]
                            }
                    }
                ));
            }
            )
    }
    //onLoaded
    insertContent = (e) =>
    {
        const nav = e.detail.nav;
        const content = e.detail.content;
        const routes = e.detail.route;
        
        if(this.#localNav && !this.#staticNav)
        {
            this.insertAdjacentHTML("afterbegin", nav);
        }

        if(!this.#staticRouting)
        {
            this.insertAdjacentHTML("beforeend", routes);
        }
        //content after because it's after in static too
        const firstRoute = this.querySelector(`${config.route.subRoutesSelector}:first-of-type`);

        if(firstRoute)
        {
            firstRoute.insertAdjacentHTML("beforebegin", content);
        }
        else
        {
            this.insertAdjacentHTML("beforeend", content);
        }
    }

    updateTarget = () =>
    {
        if(this.#state === namings.enums.state.loaded)
        {
            const hash = location.hash.substring(1);
            //recherche uniquement dans la route
            let newTarget = this.querySelector(`:scope:state(${Symbol.keyFor(namings.enums.locationMatch.exact)}) [id="${hash}"]:not(:state(${Symbol.keyFor(namings.enums.locationMatch.exact)}) ${namings.components.route} [id="${hash}"])`);
            const oldTarget = this.querySelector(`[data-target]:not(:scope ${namings.components.route} [data-target])`);
            if(oldTarget && oldTarget !== newTarget)
            {
                delete oldTarget.dataset.target;
            }
            newTarget && (newTarget.dataset.target = "");
        }
    }

    //onUnloading
    #onUnloading = (e) =>
    {
        //nothing
        this.dispatchEvent(new CustomEvent(namings.events.unloaded));
    }
    //onUnloaded
    #onUnloaded = (e) =>
    {
        let elementsToRemove = this.querySelectorAll(`:scope>*:not(:is(${this.excludeRemoveSelector}))`)
        for(let elementToRemove of elementsToRemove)
        {
            elementToRemove.remove();
        }
    }

    #onAbort = (e) =>
    {
        e.stopPropagation();
        console.debug("route ", this.#url.pathname, " ", e.type);
        this.#abortController?.abort();
    }
    //methods
    updateLocationMatch = () =>
    {
        let match = namings.enums.locationMatch.none;
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
        this.#locationMatch = match;
    }
    
    loadNav()
    {
        const navAbsolutePath = new URL(namings.files.nav, this.#url);
        fetch(navAbsolutePath)
        .then((response) =>
        {
            return response.text();
        })
        .then((html) =>
        {
            this.insertAdjacentHTML("afterbegin", html);
        });
    }

    loadRoutes()
    {

        const routeAbsolutePath = new URL(namings.files.route, this.#url);
        fetch(routeAbsolutePath)
        .then((response) =>
        {
            return response.text();
        })
        .then((html) =>
        {
            this.insertAdjacentHTML("beforeend", html);
        });
    }

    updateRoutes()
    {
        this.dispatchEvent(
            new CustomEvent(namings.events.routeChange)
        );
    }

    #routeurConstructionEventListener = (e) => 
    {
        e.detail.routeur = this;
        e.detail.url = new URL(location.origin);
    };

    #constructionEventListener = (e) => 
    {
        e.detail.url = new URL(this.#path, e.detail.url);
        if(this.#propagateStaticRouting != null)
        {
            if(this.#propagateStaticRouting)
            {
                e.detail.staticRouting = this.#staticRouting;
            }
            else
            {
                delete e.detail.staticRouting;
            }
        }
    };

    //eventsListeners
    #connectionEventListener = (e) => 
    {
        //set absolute path
        console.log("route connected !");
        //config
        this.#localNav = this.dataset.localNav ?? config.route.localNav;
        this.#staticNav = this.dataset.staticNav ?? config.route.staticNav;
        this.#staticRouting = this.dataset.staticRouting ?? e.detail.staticRouting ?? config.route.staticRouting;
        this.#loadOnPartMatching = this.dataset.loadOnPartMatching ?? config.route.loadOnPartMatching;

        this.#url = e.detail.url;
        this.#routeur = e.detail.routeur;
        
        this.excludeRemoveSelector = [];
        if(this.#localNav && this.#staticNav)
        {
            this.excludeSelector.push(navSelector)
        }
        if(this.#staticRouting)
        {
            this.excludeSelector.push(subRoutesSelector)
        }

        if(this.#localNav && this.#staticNav) 
        {
            this.loadNav();
        }
        if(this.#staticRouting) 
        {
            this.loadRoutes();
        }
        this.#state = namings.enums.state.unloaded;
        //set for first time
        this.updateLocationMatch();
        //listen to route change
        this.#routeur.addEventListener(namings.events.routeChange,
            this.updateLocationMatch);
        this.#routeur.addEventListener(namings.events.routeChange,
            this.updateTarget);
    };

 


    #popstateEventListener = (e)=>
    {
        console.debug("browser navigation");
        this.updateRoutes();
    };

    //navigation event listener

    #navigateEventListener = (e)=>
    {
        const destinationURL = e.detail.url;
        const destinationState = e.detail.state;
        let target = e.detail.target;

        if(target === "" || target === window.name)
        {
            target = "_self";
        }

        if(target === "_self")
        {
            if(location.origin === destinationURL.origin)
            {
                if(location.pathname === destinationURL.pathname
                    && location.search === destinationURL.search
                    && (destinationURL.hash !== "" || destinationURL.href.endsWith("#"))
                    && history.state === destinationState)
                {
                    if(location.hash !== destinationURL.hash)
                    {
                        location.hash = destinationURL.hash;
                    }
                }
                else if(location.href === destinationURL.href)
                {
                    console.log("refresh")
                    //just reload
                    history.go()
                    
                }
                else
                {
                    console.log("navigate")
                    history.pushState(destinationState, null, destinationURL);
                    this.updateRoutes();
                }
            }
            else
            {
                location.href = destinationURL.href;
            }
            
        }
        else
        {
            const targetOrigin = destinationURL.origin;
            const rel = e.detail.rel;
            if(target === "_blank" || rel !== "")
            {
                window.open(destinationURL, target, rel);
            }
            else
            {
                const targetWindow = window.open("", target);
                const authorizedTargetsOrigins = config.targetNavigation.targets;
                const message = 
                {
                    type: namings.events.navigate,
                    href: destinationURL.href,
                    target: target,
                    state: destinationState
                }
                
                for(const origin of authorizedTargetsOrigins)
                {
                    
                    targetWindow.postMessage(
                        message,
                        origin);
                }
                const abortTimeout = AbortSignal.timeout(config.targetNavigation.timeout);
                const abortListener = new AbortController();
                const abortSignal = AbortSignal.any([abortTimeout,abortListener.signal]);
                abortSignal.addEventListener("abort", 
                (abort)=>
                {
                    if(abortTimeout.aborted)
                    {
                        window.open(destinationURL, target);
                    }
                    else
                    {
                        console.log(`${target} window has navigated successfully`);
                    }
                });
                window.addEventListener("message",
                (response)=>
                {
                    if(response.data === namings.events.navigated)
                    {
                        response.stopImmediatePropagation();
                        abortListener.abort();
                    }
                },
                {
                    capture:true,
                    signal: abortSignal
                }
                );
            }
        }
        
    }

    #messageNavigateEventListenner = (e)=>
    {
        if(e.data.type == namings.events.navigate
            && config.targetNavigation.origins.includes(e.origin))
        {
            
            e.source.postMessage(
                namings.events.navigated,
                e.origin);
            this.dispatchEvent(
                new CustomEvent(namings.events.navigate,
                {
                    detail:
                    {
                        url: new URL(e.data.href),
                        target: e.data.target,
                        state: e.data.state,
                        rel: ""
                    }
                }
                )
            );
        }
        else
        {
            console.debug("event message is : ", e)
        }
    }

    #replaceCustomStateCSS(from, to)
    {
        //update customStateCSS
        const keyFrom = Symbol.keyFor(from);
        const keyTo = Symbol.keyFor(to);
        try
        {
            this.#internals.states.delete(`${keyFrom}`);
        }
        catch
        {
            //legacy
            this.#internals.states.delete(`--${keyFrom}`);
        }
        try
        {
            this.#internals.states.add(`${keyTo}`);
        }
        catch
        {
            //legacy
            this.#internals.states.add(`--${keyTo}`);
        }
    }

}



customElements.define(namings.components.route, Route);
