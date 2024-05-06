import namings from "./namings.js";
import config from "./config.js";
console.log("route module");

const globalStylesheet = new CSSStyleSheet();//toDo
const routeStyleSheet = new CSSStyleSheet();//toDo

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
        this.#url && console.debug("location match", this.#url.href, " : ", Symbol.keyFor(locationMatch));
        
        if(this.#_locationMatch !== locationMatch)
        {
            this.#_locationMatch = locationMatch;
            switch(this.#_locationMatch)
            {
                case namings.enums.locationMatch.exact:
                case namings.enums.locationMatch.part:
                    switch(this.#state)
                    {
                        case namings.enums.state.unloaded:
                            this.shadowRoot ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.beforeLoading, {bubbles: true, composed: true}))
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
                            this.shadowRoot ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.beforeUnloading,{bubbles: true, composed: true}))
                                : this.dispatchEvent(new CustomEvent(namings.events.unloading));
                            break;
                        case namings.enums.state.loading:
                            //toDo add abort reason
                            this.shadowRoot ? this.shadowRoot.dispatchEvent(new CustomEvent(namings.events.beforeAbort,{bubbles: true, composed: true}))
                                : this.dispatchEvent(new CustomEvent(namings.events.abort));
                            break;
                        case namings.enums.state.unloading:
                            break;
                    }
                break;
            }
            this.dataset.locationMatch = Symbol.keyFor(this.#_locationMatch);
        }
    }
    get #state()
    {
        return this.#_state;
    }

    set #state(state)
    {
        console.debug(`state for ${this.#url?.pathname} : try change to ${Symbol.keyFor(state)}`);
        if(this.#_state !== state)
        {
            this.#_state = state;
            this.dataset.state = Symbol.keyFor(this.#_state);
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
            this.#_status = status;
            this.dataset.status = Symbol.keyFor(this.#_status);
        }
    }
    
    constructor()
    {
        super();
        //toDo change to state
        this.#state = namings.enums.state.unloaded;
        this.#status = namings.enums.status.ok;
        this.#locationMatch = namings.enums.locationMatch.none;
    }
    
    //callbacks
    connectedCallback()
    {
        this.#path = this.dataset.path;
        this.#isRouteur = this.#path.startsWith('/');
        this.#propagateKeepChildRoutes = this.dataset.propagateKeepChildRoute ?? config.route.propagateKeepRouteChild;
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
        this.addEventListener(namings.events.beforeLoading,
            this.#onBeforeLoading
        );
        this.addEventListener(namings.events.loading,
            this.#onLoading
        );
        this.addEventListener(namings.events.loaded,
            this.#onLoaded
        );
        this.addEventListener(namings.events.beforeUnloading,
            this.#onBeforeUnloading
        );
        this.addEventListener(namings.events.unloading,
            this.#onUnloading
        );

        this.addEventListener(namings.events.beforeAbort,
            this.#onBeforeAbort
        );
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
        this.#routeur.removeEventListener(namings.events.routeChange, this.#routeChangeEventListener);
    }

    //state listeners
    #onUnloaded = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
        this.#state = namings.enums.state.unloaded;
    }
    #onBeforeLoading = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent(namings.events.loading));
    }
    #onLoading = (e) =>
    {
        this.#state = namings.enums.state.loading;
        //load data
        const componentAbsolutePath = new URL(namings.files.content, this.#url);
        //set abort
        this.#abortController = new AbortController();

        fetch(componentAbsolutePath)
            .then((response) =>
            {
                if(response.ok)
                {
                    this.#status = namings.enums.status.ok;
                }
                else
                {
                    this.#status = namings.enums.status.ko;
                }
                this.dispatchEvent(new CustomEvent(namings.events.loaded));
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
                this.#state = namings.enums.state.unloaded;
                switch(error.name)
                {
                    case "AbortError":
                        this.#status = namings.enums.status.aborted;
                        break;
                    default:
                        throw error;
                }
            })
            .finally(()=>
            {
                this.#abortController = null;
                console.debug("route ", this.#url.pathname, " ", e.type);
            });
        
    }
    #onLoaded = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
        this.#state = namings.enums.state.loaded;
    }
    #onBeforeUnloading = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent(namings.events.unloading));
    }
    #onUnloading = (e) =>
    {
        this.#state = namings.enums.state.unloading;
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
        this.dispatchEvent(new CustomEvent(namings.events.unloaded));
        console.debug("route ", this.#url.pathname, " ", e.type);
    }

    #onBeforeAbort = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent(namings.events.abort));
    }
    #onAbort = (e) =>
    {
        console.debug("route ", this.#url.pathname, " ", e.type);
        this.#abortController?.abort();
    }
    //methods
    updateLocationMatch()
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
    
    async loadTemplate()
    {
        if(this.#useShadow)
        {
            this.shadowRoot ?? this.attachShadow(config.route.shadowRootInit);
            const componentAbsoluteTemplatePath = new URL("template.html", this.#url);
            console.log("path is " + componentAbsoluteTemplatePath)
            await fetch(componentAbsoluteTemplatePath)
                .then(response =>
                {
                    return response.text();
                })
                .then((html) =>
                {
                    this.shadowRoot.innerHTML = html;
                }
            );
            const componentAbsoluteStylePath = new URL("style.css", this.#url);

            const localSheet = new CSSStyleSheet();
            this.shadowRoot.adoptedStyleSheets = [globalStylesheet, routeStyleSheet, localSheet];
            await fetch(componentAbsoluteStylePath)
                .then(response =>
                {
                    return response.text();
                })
                .then((css) =>
                {
                    localSheet.replace(css);
                }
            );
        }
    }

    updateRoutes()
    {
        this.dispatchEvent(
            new CustomEvent(namings.events.routeChange)
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
        this.#useShadow = this.dataset.useShadow ?? config.route.useShadow;
        this.#keepChildRoutes = this.dataset.keepChildRoutes ?? e.detail.keepChildRoutes ?? config.route.keepChildRoutes;
        this.#url = e.detail.url;
        this.#routeur = e.detail.routeur;
        //init
        this.loadTemplate();
        //set for first time
        this.updateLocationMatch();
        //listen to route change
        this.#routeur.addEventListener(namings.events.routeChange,
            this.#routeChangeEventListener);
    };

    #routeChangeEventListener = (e) =>
    {
        this.updateLocationMatch();
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
