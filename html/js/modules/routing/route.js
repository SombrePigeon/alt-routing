import namings from "./namings.js";
import config from "./config.js";
console.log("route module");

export default class Route extends HTMLElement
{
    url;
    isRouteur = false;
    rendered = false;
    shadow = null;

    //getters&setters
    get path()
    {
        return this.getAttribute(namings.attributes.path);
    }
    set path(path)
    {
        this.setAttribute(namings.attributes.path, path);
    }
    get useShadow()
    {
        return this.getAttribute(namings.attributes.useShadow) !== "false";
    }
    set useShadow(value)
    {
        this.setAttribute(namings.attributes.useShadow, value);
    }
    get locationMatch()
    {
        return this.getAttribute(namings.attributes.locationMatching);
    }
    set locationMatch(value)
    {
        this.setAttribute(namings.attributes.locationMatching, value);
    }    

    //observers
    static observedAttributes = [namings.attributes.locationMatching];

    attributeChangedCallback(name, oldValue, newValue)
    {
        if(namings.attributes.locationMatching === name
            && oldValue !== newValue)
        {
            this.updateRouteState();
        }
    }
    
    constructor(path = null, useShadow = null)
    {
        super();

        if(path)
        {
            this.path = path;
        }
        else if (this.path == null)
        {
            console.error("not path for route");
        }
        
        if(useShadow)
        {
            this.useShadow = useShadow;
        }
        else if(this.useShadow == null)
        {
            this.useShadow = config.useShadow;
        }
        
        this.locationMatch = namings.attributes.locationMatchingValues.none;

        this.isRouteur = this.path.startsWith('/');
    }

    //callbacks
    connectedCallback()
    {
        if(this.isRouteur)
        {
            console.log("route is routeur");
            this.addEventListener(namings.events.connectingRoutingComponent,
                e => 
                {
                    e.detail.routeur = this;
                    e.detail.path = "";
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
        )

        console.log("route is connecting");
        this.dispatchEvent(
            new CustomEvent(namings.events.connectingRoutingComponent,
                {
                    composed: true,
                    detail: {}//must be initialized
                }
            )
        ); 
    }

    disconnectedCallback()
    {
        console.log("disconnect" + this.url);
        //disconnect window eventListenners
        if(this.isRouteur)
        {
            window.removeEventListener("popstate", this.#popstateEventListener);
            window.addEventListener("message", this.#messageNavigateEventListenner);
        }
        this.routeur.removeEventListener(namings.events.routeChange, this.#routeChangeEventListener);
    }

    //methods
    setMatching()
    {
        const locationMatchingValues = namings.attributes.locationMatchingValues;
        let match = locationMatchingValues.none;
        if(location.pathname.startsWith(this.url.pathname))//refait ça stp ! signé toi de hier
        {
            if(location.pathname === this.url.pathname)// ça aussi
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

    updateRouteState()
    {
        const render = this.locationMatch !== namings.attributes.locationMatchingValues.none;
        if(!this.rendered && render)
        {
            this.loadRoute();
            this.rendered = true;
        }
        else if(this.rendered && !render) 
        {
            this.unloadRoute();
            this.rendered = false;
        }
    }

    async loadRoute()
    {
        const componentAbsolutePath = new URL("content.html", this.url);
        console.log("path is " + componentAbsolutePath);
        await fetch(componentAbsolutePath)
            .then((response) =>
            {
                return response.text();
            })
            .then((html) =>
            {
                this.innerHTML = html;
            });
    
    }

    unloadRoute()
    {
        for (let child of this.childNodes)
        {
            this.removeChild(child);
        }
    }

    async loadTemplate()
    {
        if(this.useShadow)
        {
            if(this.shadow == null)
            {
                this.shadow = this.attachShadow({mode: "open"});
            }

            const componentAbsoluteTemplatePath = new URL("template.html", this.url);
            console.log("path is " + componentAbsoluteTemplatePath)
            await fetch(componentAbsoluteTemplatePath)
                .then(response =>
                {
                    return response.text();
                })
                .then((html) =>
                {
                    this.shadow.innerHTML = html;
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
        this.url = e.detail.url;
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
                (e)=>
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
                (e)=>
                {
                    if(e.data === namings.events.navigated)
                    {
                        abortListener.abort();
                    }
                },
                {
                    signal: abortSignal
                }
                );
            }
        }
        
    }

    #messageNavigateEventListenner = (e)=>
    {
        if(e.data.type == namings.events.navigate
            || config.targetNavigation.origins.includes(e.origin))
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
    }
}

customElements.define(namings.components.route, Route);
