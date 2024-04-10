import namings from "./namings.js";
import config from "./config.js";
console.log("route module");

export default class Route extends HTMLElement
{
    #url;
    #isRouteur = false;
    #shadow = null;
    #nav = false;
    #recursive = false;

    #setProperties()
    {
        //toDo 
        Object.defineProperty(this, "path", {
            enumerable: true,
            get: this.getPath,
            set: this.setPath
        });

        Object.defineProperty(this, "useShadow", {
            enumerable: true,
            get: this.getUseShadow,
            set: this.setUseShadow
        });

        Object.defineProperty(this, "locationMatch", {
            enumerable: true,
            get: this.getLocationMatch,
            set: this.setLocationMatch
        });
    }
    //getters&setters
    getPath()
    {
        
        return this.getAttribute(namings.attributes.path);
    }
    setPath(path)
    {
        this.setAttribute(namings.attributes.path, path);
    }
    getUseShadow()
    {
        return this.getAttribute(namings.attributes.useShadow) !== "false";
    }
    setUseShadow(value)
    {
        if(this.#shadow)
        {
            console.error("shadow is already loaded, you can't set it anymore");
        }
        else
        {
            this.setAttribute(namings.attributes.useShadow, value);
        }

    }
    getLocationMatch()
    {
        return this.getAttribute(namings.attributes.locationMatching);
    }
    setLocationMatch(value)
    {
        this.setAttribute(namings.attributes.locationMatching, value);
    }    

    //observers
    static observedAttributes = [namings.attributes.locationMatching,"data-state"];

    attributeChangedCallback(name, oldValue, newValue)
    {
        if(oldValue !== newValue)
        {
            switch(name)
            {
                case namings.attributes.locationMatching:
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
                            this.loadRoute();
                            break;
                        case namings.enum.state.unloading:
                            this.dispatchEvent(new CustomEvent(namings.events.unloading));
                            this.unloadRoute();
                            break;
                    }
            }
        }
    }
    
    constructor(path = null, useShadow = null)
    {
        super();
        this.#setProperties();
        if(path)
        {
            this.path = path;
        }
        else if (this.path == null)
        {
            console.error("no path for route");
        }
        if(useShadow)
        {
            this.useShadow = useShadow;
        }
        else if(this.useShadow == null)
        {
            this.useShadow = config.useShadow;
        }
        this.dataset.state = Symbol.keyFor(namings.enum.state.unloaded);
        this.dataset.reason = Symbol.keyFor(namings.enum.reason.ok);
        this.locationMatch = namings.attributes.locationMatchingValues.none;
        this.#isRouteur = this.path.startsWith('/');
    }

    //callbacks
    connectedCallback()
    {
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
            this.#constructUrlEventListener,
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
        this.routeur.removeEventListener(namings.events.routeChange, this.#routeChangeEventListener);
    }

    //state listeners
    #onUnloaded = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
    }
    #onLoading = (e) =>
    {
        //load data
        //this.loadRoute();
        //this.dataset.state = namings.enum.state.loaded;
        console.debug("route ", this.#url.pathname, " ", e.type);
    }
    #onLoaded = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
    }
    #onUnloading = (e) =>
    {
        //unloadData
        //this.unloadRoute();
        //this.dataset.state = namings.enum.state.unloaded;
        console.debug("route ", this.#url.pathname, " ", e.type);
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
        this.locationMatch = match;
    }

    async loadRoute()
    {
        const componentAbsolutePath = new URL("content.html", this.#url);
        console.log("path is " + componentAbsolutePath);
        try
        {
            await fetch(componentAbsolutePath)
                .then((response) =>
                {
                    return response.text();
                })
                .then((html) =>
                {
                    this.innerHTML = html;
                    this.dataset.state = Symbol.keyFor(namings.enum.state.loaded);
                    this.dataset.reason = Symbol.keyFor(namings.enum.reason.ok);
                });
        }
        catch(error)
        {
            this.dataset.state = Symbol.keyFor(namings.enum.state.unloaded);
            this.dataset.reason = Symbol.keyFor(namings.enum.reason.ko);
            throw error;
        }
        
    
    }

    unloadRoute()
    {
        let elementsToRemove=[];
        for (const child of this.children)
        {
            const remove = !this.#recursive || (child.tagName !== namings.components.route.toLocaleUpperCase());
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
    }

    async loadTemplate()
    {
        if(this.useShadow)
        {
            if(this.#shadow == null)
            {
                this.#shadow = this.attachShadow({mode: "open"});
            }

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

    #constructUrlEventListener = (e) => 
    {
        e.detail.url = new URL(this.path, e.detail.url);
    };

    //eventsListeners
    #connectionEventListener = (e) => 
    {
        //set absolute path
        console.log("route connected !");
        this.#url = e.detail.url;
        this.routeur = e.detail.routeur;
        this.loadTemplate();
        //set for first time
        this.setMatching();
        //listen to route change
        this.routeur.addEventListener(namings.events.routeChange,
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
