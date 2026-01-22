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
        if(navigation)
        {
            console.debug("init navigation event");
            navigation.addEventListener("navigate", this.#beforeNavigateEventListener);
        }
        
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
        
        baseRoute.initRoutingPromise.then(
            _ =>
            {
                navigation.addEventListener("navigate", this.#afterNavigateEventListener);
            }
        )

        
        //this.startRouting();
        
    }

    disconnectedCallback()
    {

    }

    #beforeNavigateEventListener = (navigateEvent) =>
    {
        //aggremente l'event avec alt-routing
        if(new URL(navigateEvent.destination.url).pathname.startsWith(this.#path))
        {
            navigateEvent.altRouting ??= {};
            navigateEvent.altRouting.writeDom ??= Promise.withResolvers();
            navigateEvent.altRouting.fetchs ??= [];
            navigateEvent.altRouting.domChanges ??= [];
            //toDo replace with 
            navigateEvent.altRouting.referrer ??= navigation.currentEntry.url;
        
        
    }

    #afterNavigateEventListener = (navigateEvent) =>
    {
        Promise.all(navigateEvent.altRouting.fetchs)
        .then(navigateEvent.altRouting.writeDom.resolve());

        const handler = _ =>
        {
            return Promise.all(navigateEvent.altRouting.domChanges)
        }
        navigateEvent.intercept(
            {
                handler
            }
        )
        
    }

    #routeConstructionEventListener = (e) => 
    {
        e.detail.router = this;
    };


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
