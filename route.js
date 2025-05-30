import namings from "./namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : route");

export default class Route extends HTMLElement
{
    #internals;

    //config
    #isRouteur;
    #localNav;
    #staticNav;
    #staticRouting;
    #propagateStaticRouting;
    #locationMatchExact
    #locationMatchPart;
    #locationMatchNone;
    
    //attr
    #path;
    #routeur;
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
        switch(locationMatchMode)
        {
            case namings.enums.locationMatchType.fresh:
                this.shadowRoot
                        ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.loading, {bubbles: true, composed: true}))
                        : this.dispatchEvent(new CustomEvent(namings.events.loading));
                break;
            case namings.enums.locationMatchType.still:
                if(this.#_state === namings.enums.state.unloading
                    || this.#_state === namings.enums.state.unloaded
                )
                {
                    this.shadowRoot
                        ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.loading, {bubbles: true, composed: true}))
                        : this.dispatchEvent(new CustomEvent(namings.events.loading));
                }
                break;
            case namings.enums.locationMatchType.hidden:
                this.shadowRoot
                    ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.unloading,{bubbles: true, composed: true}))
                    : this.dispatchEvent(new CustomEvent(namings.events.unloading));
                break;
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

    get staticNav()
    {
        return this.#staticNav;
    }

    get staticRouting()
    {
        return this.#staticRouting;
    }
    
    //callbacks
    connectedCallback()
    {
        this.#internals = this.attachInternals();
        this.#state = namings.enums.state.init;
        this.#status = "";
        this.#locationMatch = namings.enums.locationMatch.none;
        
        this.#path = this.dataset.path;
        this.#isRouteur = this.#path.startsWith('/');
        this.#propagateStaticRouting = this.dataset.propagateStaticRouting ?? config.route.propagateStaticRouting;
        if(this.#isRouteur)
        {
            this.addEventListener(namings.events.connectComponent,
                this.#routeurConstructionEventListener,
                {
                    capture: true
                }
            );
            window.addEventListener("popstate",
            this.#popstateEventListener);
            this.addEventListener(namings.events.navigate,
                this.#navigateEventListener);
            window.addEventListener("message", this.#messageNavigateEventListenner);
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
        if(this.#isRouteur)
        {
            window.removeEventListener("popstate", this.#popstateEventListener);
            window.removeEventListener("message", this.#messageNavigateEventListenner);
        }
        this.#routeur.removeEventListener(namings.events.routeChange, this.updateLocationMatch);
        this.dispatchEvent(namings.events.disconnectComponent);
    }

    //state listeners
    //onLoading
    fetchContent = (e) =>
    {
        //load data
        const contentAbsolutePath = new URL(namings.files.content, this.#url);

        const abortController = this.#abortController;

        const navPromise = (this.#localNav && !this.#staticNav) ?
            fetch(new URL(namings.files.nav, this.#url),
            {
                signal: abortController.signal
            })
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
            
            const routingPromise = (!this.#staticRouting) ?
                fetch(new URL(namings.files.routing, this.#url),
                {
                    signal: abortController.signal
                })
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
                                    content: promises[1].html,
                                    status: promises[1].status,
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
        
        //content after because it's after in static routing too
        const routingFirstElement = this.querySelector(`${config.route.routingSelector}:first-of-type`);
        
        if(routingFirstElement)
        {
            routingFirstElement.insertAdjacentHTML("beforebegin", e.detail.content);
        }
        else
        {
            this.insertAdjacentHTML("beforeend", e.detail.content);
        }
        this.#status = e.detail.status;
    }

    insertNav = (e) =>
    {
        this.insertAdjacentHTML("afterbegin", e.detail.nav);
    }

    insertRouting = (e) =>
    {
        this.insertAdjacentHTML("beforeend", e.detail.routing);
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

    #connectionEventListener = (e) => 
    {
        //config
        this.#localNav = this.dataset.localNav ?? config.route.localNav;
        if(this.#localNav)
        {
            this.#replaceCustomStateCSS(undefined, "localNav");
        }
        this.#staticNav = this.dataset.staticNav ?? config.route.staticNav;
        if(this.#staticNav)
        {
            this.#replaceCustomStateCSS(undefined, "staticNav");
        }
        this.#staticRouting = this.dataset.staticRouting ?? e.detail.staticRouting ?? config.route.staticRouting;
        if(this.#staticRouting)
        {
            this.#replaceCustomStateCSS(undefined, "staticRouting");
        }
        this.#locationMatchExact = this.dataset.locationMatchExact ?? config.route.locationMatchExact;
        this.#locationMatchPart = this.dataset.locationMatchPart ?? config.route.locationMatchPart;
        this.#locationMatchNone = this.dataset.locationMatchNone ?? config.route.locationMatchNone;
        this.#url = e.detail.url;
        this.#routeur = e.detail.routeur;
        this.#lastRoute =location.href.split('#')[0];
        
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
    };

 


    #popstateEventListener = (e)=>
    {
        const currentRoute = location.href.split('#')[0];
        if(this.#lastRoute !== currentRoute)
        {
            this.#lastRoute = currentRoute;
            this.updateRoutes();
        }
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
                    //just reload
                    history.go()
                }
                else
                {
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
                console.info(`alt-routing open window : '${target}'`);
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
                        console.info(`alt-routing : target window '${target}' has navigated forcefully`);
                    }
                    else
                    {
                        console.info(`alt-routing : target window '${target}' has navigated gracefully`);
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

    #messageNavigateEventListenner = (message)=>
    {
        if(message.data.type == namings.events.navigate
            && config.targetNavigation.origins.includes(message.origin))
        {
            
            message.source.postMessage(
                namings.events.navigated,
                message.origin);
            this.dispatchEvent(
                new CustomEvent(namings.events.navigate,
                {
                    detail:
                    {
                        url: new URL(message.data.href),
                        target: message.data.target,
                        state: message.data.state,
                        rel: ""
                    }
                }
                )
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
