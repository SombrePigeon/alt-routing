import namings from "./namings.js";
import config from "./config.js";
console.log("route module");

export default class Route extends HTMLElement
{
    //config
    #isRouteur;
    #useShadow;
    #loadNav = false;
    #keepChildRoutes;
    #propagateKeepChildRoutes
    
    #path;
    #routeur;
    #url;
    #shadow = null;
    #abortController = null;

    //observers
    static observedAttributes = ["data-match-location","data-state"];

    attributeChangedCallback(name, oldValue, newValue)
    {
        if(oldValue !== newValue)
        {
            switch(name)
            {
                case "data-match-location":
                    switch(newValue)
                    {
                        case namings.attributes.locationMatchingValues.exact:
                        case namings.attributes.locationMatchingValues.part:
                            
                            switch(Symbol.for(this.dataset.state))
                            {
                                case namings.enum.state.unloaded:
                                    this.dataset.state = Symbol.keyFor(namings.enum.state.loading);
                                    break;
                                case namings.enum.state.loaded:
                                    break;
                                case namings.enum.state.loading:
                                    break;
                                case namings.enum.state.unloading:
                                    break;
                            }
                            break;
                            case namings.attributes.locationMatchingValues.none:
                            switch(Symbol.for(this.dataset.state))
                            {
                                case namings.enum.state.unloaded:
                                    break;
                                case namings.enum.state.loaded:
                                    this.dataset.state = Symbol.keyFor(namings.enum.state.unloading);
                                    break;
                                case namings.enum.state.loading:
                                    break;
                                case namings.enum.state.unloading:
                                    break;
                            }
                    }
                    break;
                case "data-state":
                    switch(Symbol.for(this.dataset.state))
                    {
                        case namings.enum.state.unloaded:
                            this.dispatchEvent(new CustomEvent(namings.events.unloaded));
                            break;
                        case namings.enum.state.loaded:
                            this.dispatchEvent(new CustomEvent(namings.events.loaded));
                            break;
                        case namings.enum.state.loading:
                            this.dispatchEvent(new CustomEvent(namings.events.loading));
                            break;
                        case namings.enum.state.unloading:
                            this.dispatchEvent(new CustomEvent(namings.events.unloading));
                            break;
                    }
            }
        }
    }
    
    constructor()
    {
        super();
        this.dataset.state = Symbol.keyFor(namings.enum.state.unloaded);
        this.dataset.status = Symbol.keyFor(namings.enum.status.ok);
        this.dataset.matchLocation = namings.attributes.locationMatchingValues.none;
    }
    
    //callbacks
    connectedCallback()
    {
        this.#path = this.dataset.path;
        this.#isRouteur = this.#path.startsWith('/');
        this.#propagateKeepChildRoutes = this.dataset.propagateKeepRoute ?? config.route.propagateKeepRouteChild;
        if(this.#isRouteur)
        {
            console.log("route is routeur");
            this.addEventListener(namings.events.connectingRoutingComponent,
                e => 
                {
                    e.detail.routeur = this;
                    e.detail.url = new URL(location.origin);
                },
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

        this.addEventListener(namings.events.unloaded,
            this.#onUnloaded
        );
        this.addEventListener(namings.events.loading,
            this.#onLoading
        );
        this.addEventListener(namings.events.loaded,
            this.#onLoaded
        );
        this.addEventListener(namings.events.unloading,
            this.#onUnloading
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
        this.#routeur.removeEventListener(namings.events.routeChange, this.#routeChangeEventListener);
    }

    //state listeners
    #onUnloaded = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
    }
    #onLoading = (e) =>
    {
        //load data
        const componentAbsolutePath = new URL(namings.files.content, this.#url);
        //set abort
        this.#abortController = new AbortController();
        this.addEventListener(namings.events.abort,this.#onAbort);

        fetch(componentAbsolutePath)
            .then((response) =>
            {
                this.dataset.state = Symbol.keyFor(namings.enum.state.loaded);
                if(response.ok)
                {
                    this.dataset.status = Symbol.keyFor(namings.enum.status.ok);
                }
                else
                {
                    this.dataset.status = Symbol.keyFor(namings.enum.status.ko);
                }
                return response.text();
            },
            {
                signal: this.#abortController.signal
            })
            .then((html) =>
            {
                this.innerHTML = html;
            })
            .catch((error) =>
            {
                this.dataset.state = Symbol.keyFor(namings.enum.state.unloaded);
                switch(error.name)
                {
                    case "AbortError":
                        this.dataset.status = Symbol.keyFor(namings.enum.status.aborted);
                        break;
                    default:
                        throw error;
                }
            })
            .finally(()=>
            {
                this.removeEventListener(namings.events.abort, this.#onAbort);
                this.#abortController = null;
                console.debug("route ", this.#url.pathname, " ", e.type);
            });
        
    }
    #onLoaded = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
    }
    #onUnloading = (e) =>
    {
        //unloadData
        let elementsToRemove=[];
        for (const child of this.children)
        {
            const remove = !this.#keepChildRoutes || (child.tagName !== namings.components.route.toLocaleUpperCase());
            if(remove)
            {
                elementsToRemove.push(child);
            }
        }
        for(let elementToRemove of elementsToRemove)
        {
            elementToRemove.remove();
        }
        this.dataset.state = Symbol.keyFor(namings.enum.state.unloaded);
        this.dataset.state = Symbol.keyFor(namings.enum.state.unloaded);
        console.debug("route ", this.#url.pathname, " ", e.type);
    }

    #onAbort = (e) =>
    {
        this.#abortController?.abort();
    }
    //methods
    setMatching()
    {
        const locationMatchingValues = namings.attributes.locationMatchingValues;
        let match = locationMatchingValues.none;
        //toDo try opti
        if(location.pathname.startsWith(this.#url.pathname))
        {
            if(location.pathname === this.#url.pathname)
            {
                match = locationMatchingValues.exact;
            }
            else
            {
                match = locationMatchingValues.part;
            }
        }
        this.dataset.matchLocation = match;
    }

    async loadTemplate()
    {
        if(this.#useShadow)
        {
            this.#shadow ??= this.attachShadow(config.route.shadowRootInit);
            const componentAbsoluteTemplatePath = new URL("template.html", this.#url);
            console.log("path is " + componentAbsoluteTemplatePath)
            await fetch(componentAbsoluteTemplatePath)
                .then(response =>
                {
                    return response.text();
                })
                .then((html) =>
                {
                    this.#shadow.innerHTML = html;
                }
            );
        }
    }

    updateRoutes()
    {
        this.dispatchEvent(
            new CustomEvent(namings.events.routeChange,
                {
                    bubbles:true,
                    composed: true
                }
            )
        );
    }

    #constructionEventListener = (e) => 
    {
        e.detail.url = new URL(this.#path, e.detail.url);
        if(this.#propagateKeepChildRoutes != null)
        {
            if(this.#propagateKeepChildRoutes)
            {
                e.detail.keepChildRoutes = this.#keepChildRoutes;
            }
            else
            {
                delete e.detail.keepChildRoutes;
            }
        }
    };

    //eventsListeners
    #connectionEventListener = (e) => 
    {
        //set absolute path
        console.log("route connected !");
        //config
        this.#useShadow = this.dataset.useShadow ?? e.detail.useShadow ?? config.route.useShadow;
        this.#keepChildRoutes = this.dataset.keepChildRoutes ?? e.detail.keepChildRoutes ?? config.route.keepChildRoutes;
        this.#url = e.detail.url;
        this.#routeur = e.detail.routeur;
        //init
        this.loadTemplate();
        //set for first time
        this.setMatching();
        //listen to route change
        this.#routeur.addEventListener(namings.events.routeChange,
            this.#routeChangeEventListener);
    };

    #routeChangeEventListener = (e) =>
    {
        this.setMatching();
    };

    #popstateEventListener = (e)=>
    {
        console.log("browser navigation");
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
            if(location.href !== destinationURL.href
                || history.state !== destinationState)
            {
                console.log("navigate")
                history.pushState(destinationState, null, destinationURL);
                this.updateRoutes();
            }
            else
            {
                console.log("refresh")
                //just reload
                history.go()
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
}



customElements.define(namings.components.route, Route);
