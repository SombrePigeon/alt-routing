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
    #abortController;

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
                
                if(this.#_locationMatch === namings.enums.locationMatch.exact 
                    ||
                    (
                        this.#loadOnPartMatching &&
                        this.#_locationMatch === namings.enums.locationMatch.part
                    )
                )
                {
                    this.shadowRoot ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.loading, {bubbles: true, composed: true}))
                                : this.dispatchEvent(new CustomEvent(namings.events.loading));
                }
                else if(this.#_locationMatch === namings.enums.locationMatch.none
                    ||
                    (
                        !this.#loadOnPartMatching &&
                        this.#_locationMatch === namings.enums.locationMatch.part
                    )
                )
                {
                    this.shadowRoot ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.unloading,{bubbles: true, composed: true}))
                                : this.dispatchEvent(new CustomEvent(namings.events.unloading));
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
            this.#removeContent
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

        const abortController = this.#abortController;

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
                signal: abortController.signal
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
            
            const routingPromise = (!this.#staticRouting) ?
                fetch(new URL(namings.files.routing, this.#url))
                .then((response) =>
                {
                    return response.text();
                })
                :
                Promise.resolve();
                
            const allPromise = Promise.all([navPromise, contentPromise, routingPromise])
            .then(promises =>
            {
                if(!abortController.signal.aborted)
                {
                    this.dispatchEvent(new CustomEvent(namings.events.loaded,
                        {
                            detail : 
                                {
                                    nav: promises[0],
                                    content: promises[1],
                                    routing: promises[2]
                                }
                        }
                    ));
                }
            }
            )
    }
    //onLoaded
    insertContent = (e) =>
    {
        this.#removeContent();

        if(this.#localNav && !this.#staticNav)
        {
            this.insertNav(e);
        }

        if(!this.#staticRouting)
        {
            this.insertRouting(e);
        }
        //content after because it's after in static too
        const routingFirstElement = this.querySelector(`${config.route.routingSelector}:first-of-type`);

        if(routingFirstElement)
        {
            routingFirstElement.insertAdjacentHTML("beforebegin", e.detail.content);
        }
        else
        {
            this.insertAdjacentHTML("beforeend", e.detail.content);
        }
    }

    insertNav = (e) =>
    {
        this.insertAdjacentHTML("afterbegin", e.detail.nav);
    }

    insertRouting = (e) =>
    {
        this.insertAdjacentHTML("beforeend", e.detail.routing);
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
    #removeContent = (e) =>
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

    updateRoutes()
    {
        this.dispatchEvent(new CustomEvent(namings.events.routeChange));
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
        
        //set selectors to remove on unloading
        this.excludeRemoveSelector = [];
        if(this.#localNav && this.#staticNav)
        {
            this.excludeRemoveSelector.push(config.route.navSelector)
        }
        if(this.#staticRouting)
        {
            this.excludeRemoveSelector.push(config.route.routingSelector)
        }

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
        if(this.#staticRouting) 
        {
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
