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
        this.innerHTML = 
        `
            <${namings.components.route} data-path="${this.#path}">
            </${namings.components.route}>
        `;

        window.addEventListener("popstate", this.#popstateEventListener);
        this.addEventListener(namings.events.navigate,
            this.#navigateRequalifyTargetEventListener);
        this.addEventListener(namings.events.navigate,
            this.#navigateOnOtherTargetEventListener);
        this.addEventListener(namings.events.navigate,
            this.#navigateEventListener);
        window.addEventListener("message", this.#messageNavigateEventListenner);

    }

    disconnectedCallback()
    {
        window.removeEventListener("popstate", this.#popstateEventListener);
        window.removeEventListener("message", this.#messageNavigateEventListenner);
    }


    //handle popstate
    #popstateEventListener = (e)=>
    {
        const currentRoute = location.href.split('#')[0];
        if(this.#referer !== currentRoute)
        {
            this.#referer = currentRoute;// not set in back navigation ??
        }
        this.dispatchEvent(
            new CustomEvent(namings.events.navigate,
                {
                    detail:
                        {
                            url: new URL(location.href),
                            source: "popstate"
                        }
                }
            )
        );
    };

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
        if(e.detail.target !== "_self")
        {
            e.stopImmediatePropagation();
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
        const source = e.detail.source; 
        if(source !== "popstate")//add firstLoad
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
                }
            }
            else
            {
                location.href = destinationURL.href;
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
}

customElements.define(namings.components.router, Router, { extends: config.routeur.extends });
