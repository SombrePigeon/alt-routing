import namings from "./namings.js";
import Route from "./route.js";//required
import {addShadowToConnectingRoutes} from "./features/shadow.js";
import {addStyleToConnectingRoutes} from "./features/style.js"
import {addUpdateTarget} from "./features/target.js";
import config from "alt-routing/config";

console.info("alt-routing module init : router");

const ParentClass = document.createElement(config.routeur.extends).constructor;

export default class Router extends ParentClass
{
    #path;
    #referer;
    connectedCallback()
    {
        this.#path = this.dataset.path ?? '/';
        if(!this.#path.startsWith('/'))
        {
            throw new Error("Router path must be absolute");
        }

        //init features
        if(config.routeur.features.shadowRouting)
        {
            addShadowToConnectingRoutes(this);
            if(config.routeur.features.styleShadowRouting)
            {
                addStyleToConnectingRoutes(this);
            }
        }
        if(config.routeur.features.updateTarget)
        {
            addUpdateTarget(this);
        }
        
        //navigations event
        window.addEventListener("popstate", this.#popstateEventListener);
        
        this.addEventListener(namings.events.navigate,
            this.#navigateSetReferrerEventListenner,
            {
                capture: true
            });
        
        this.addEventListener(namings.events.navigate,
            this.#navigateRequalifyTargetEventListener,
            {
                capture: true
            });
        this.addEventListener(namings.events.navigate,
            this.#navigateOnOtherTargetEventListener,
            {
                capture: true
            });
        this.addEventListener(namings.events.navigate,
            this.#navigateEventListener);
        
        
        window.addEventListener("message", this.#messageNavigateEventListenner);
        
        //add router ref to routing components on connection
        this.addEventListener(namings.events.connectComponent,
            this.#routeConstructionEventListener,
            {
                capture: true
            }
        );


        //toDo get innerHTML and send it in an event
        //add base route
        this.innerHTML = 
        `
            <${namings.components.route} data-path="${this.#path}">
            </${namings.components.route}>
        `;
        //toDo when routing init end, add navigate write
        const baseRoute = this.children[0];
        baseRoute.addEventListener(namings.events.routingReady, (e) =>
        {
            this.addEventListener(namings.events.navigate, 
                this.#startViewTransition
            );
            this.dispatchEvent(
            new CustomEvent(namings.events.navigate,
                {
                    detail:
                        {
                            url: new URL(location.href),
                            type: "initial",
                            target: "_self",
                            rel: ""
                        }
                }
            )
        );
        },
        {
            once: true
        });

        navigation?.addEventListener("navigate", this.#navigateApiEventListener);
        //this.startRouting();
        
    }

    disconnectedCallback()
    {
        window.removeEventListener("popstate", this.#popstateEventListener);
        window.removeEventListener("message", this.#messageNavigateEventListenner);
    }

    #navigateApiEventListener = (navigateEvent) =>
    {
        //this.startRouting(navigateEvent);
        navigateEvent.intercept(
            {
                //handler: async (e) => console.log("coucou1"),
                precommitHandler: async (e) => console.log("prout1")
            }
        )
        navigateEvent.intercept(
            {
                //handler: async (e) => console.log("coucou2"),
                precommitHandler: async (e) => console.log("prout2")
            }
        )
    }
/*
    async startRouting(navigateEvent)
    {
        console.log("routing on ", navigateEvent?.destination ?? location);

        const domChanges = [];
        const domLoaded = Promise.all(e.detail.domChanges);
        const writeDom = Promise.withResolvers();
        const abortController = new AbortController();

        const routingEvent = new CustomEvent(namings.events.startRouting,
            {
                detail:
                    {
                        navigateEvent,
                        domchanges: [],

                    }
            }
        );

        const precommitHandler = navigationPrecommitController =>
            {
                e.detail.navigationPrecommitController = navigationPrecommitController;
                this.dispatchEvent(routingEvent);
            };
        const handler = _ =>
            {

            };




        const {promise, resolve} = Promise.withResolvers();
        /*this.addEventListener(namings.events.routingDone,

        );*/
/*
        const updateRoutes = navigateEvent?.canIntercept
            && !navigateEvent?.hashChange
            && !navigateEvent?.downlaodRequest
            ;

        if(updateRoutes)
        {
            navigateEvent.detail.domChanges = [];
            navigateEvent.detail.domLoaded = Promise.all(e.detail.domChanges);

            navigateEvent.detail.writeDom = Promise.withResolvers();
            navigateEvent.detail.abortController = new AbortController();

            navigateEvent.detail.domLoaded.then(e=>
                {
                    this.dispatchEvent(new CustomEvent(namings.events.navigated));
                }
            );
        }

        await promise;
    }*/

    #startRoutingEventListenner = (routingEvent) =>
    {
        Promise.all(routingEvent.detail.domChanges)
    }

    #routeConstructionEventListener = (e) => 
    {
        e.detail.router = this;
    };

    //handle popstate
    #popstateEventListener = (e)=>
    {
        const currentRoute = location.href.split('#')[0];
        const referer = this.#referer;
        if(this.#referer !== currentRoute)
        {
            this.#referer = currentRoute;//toDo check if not set in back navigation ??
        }
        this.dispatchEvent(
            new CustomEvent(namings.events.navigate,
                {
                    detail:
                        {
                            url: new URL(location.href),
                            type: "popstate",
                            target: "_self",
                            rel: ""
                        }
                }
            )
        );
    };

    #navigateSetReferrerEventListenner = (e) =>
    {
        e.detail.referrer = location.href;
    }

    //navigation event listener
    /*requalify target as self if it is*/
    #navigateRequalifyTargetEventListener = (e)=>
    {
        if(e.detail.target === "" || e.detail.target === window.name)
        {
            e.detail.target = "_self";
        }
    }
    /*cancel if not local  */
    #navigateOnOtherTargetEventListener = (e)=>
    {
        const target = e.detail.target;
        if(target !== "_self")
        {
            e.stopImmediatePropagation();
            const rel = e.detail.rel;
            const destinationURL = e.detail.url;
            const destinationState = e.detail.state;
            if(target === "_blank" || rel !== "")
            {
                window.open(destinationURL, target, rel);
                console.info(`alt-routing open window : '${target}'`);
            }
            else
            {
                const targetWindow = window.open("", target);
                debugger
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
                ()=>
                {
                    if(abortTimeout.aborted)
                    {
                        window.open(destinationURL, target);
                        console.debug(`alt-routing : target window '${target}' has navigated forcefully`);
                    }
                    else
                    {
                        console.debug(`alt-routing : target window '${target}' has navigated gracefully`);
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

    #navigateEventListener = (e)=>
    {
        const type = e.detail.type; 
        const navigate = type === "popstate" || type === "initial";

        let updateRoutes = false;
        
        if(!navigate)
        {
            const destinationURL = e.detail.url;
            const destinationState = e.detail.state;
    
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
                    updateRoutes = true;
                }
            }
            else
            {
                location.href = destinationURL.href;
            }
        }
        else
        {
            updateRoutes = true;
        }
        if(updateRoutes)
        {
            e.detail.domChanges = [];
            e.detail.domLoaded = Promise.all(e.detail.domChanges);
            e.detail.writeDom = Promise.withResolvers();
            e.detail.abortController = new AbortController();

            e.detail.domLoaded.then(e=>
                {
                    this.dispatchEvent(new CustomEvent(namings.events.navigated));
                }
            );
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

    #startViewTransition = (e) =>
    {
        const domLoaded = e.detail.domLoaded;
        if(!document.startViewTransition)
        {
            e.detail.writeDom.resolve();
        }
        else
        {
            const viewTransition =
            document.startViewTransition(async ()=>
            {
                e.detail.writeDom.resolve();
                await domLoaded;
            });//toDo add param with type alt-routing (param from navigation)

            e.detail.viewTransition = viewTransition;
        }
    }
}

customElements.define(namings.components.router, Router, { extends: config.routeur.extends });
