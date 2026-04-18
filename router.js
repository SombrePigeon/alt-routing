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
        const origin = location.origin;
        const path = this.dataset.path ?? '/';
        if(!path.startsWith('/'))
        {
            throw new Error("Router path must be absolute");
        }
        const pathURL = new URL(path, origin);
        if(pathURL.origin != location.origin)
        {
            throw new Error("Router path must be same origin");
        }

        this.#path = pathURL.pathname;

        //init features
        if(config.routeur.features.shadowRouting)
        {
            addShadowToConnectingRoutes(this);
            if(config.routeur.features.styleShadowRouting)
            {
                addStyleToConnectingRoutes(this);
            }
        }

        //toDo check if usefull in 2.0
        if(config.routeur.features.updateTarget)
        {
            addUpdateTarget(this);
        }
        
        //navigations event
        if(navigation)
        {
            //toDo remove capture (not in dom :/)
            //also choose if use check subroute for handle or use <route external> ?
            console.debug("init navigation event");
            navigation.addEventListener("navigate", this.#beforeNavigateEventListener,
            {
                capture: true
            });
            if(config.routeur.features.viewTransition)
            {
                navigation.addEventListener("navigate", this.#attachViewTransition);
            }
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
        //toDo secure trusted type
        this.innerHTML = 
        `
            <${namings.components.route} path="${this.#path}">
            </${namings.components.route}>
        `;
        //toDo when routing init end, add navigate write
        const baseRoute = this.children[0];
        
        baseRoute.routingReady.then(
            _ =>
            {
                //navigation.addEventListener("navigate", this.#afterNavigateEventListener);
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
            //init
            navigateEvent.altRouting ??= {};
            //toDo check if a route match
            const update = navigateEvent.canIntercept 
            && !navigateEvent.hashChange 
            && !navigateEvent.downloadRequest
            && this.#isLocalNavigation(navigateEvent)
            //remove next line, routeur checkif a route match
            && new URL(navigateEvent?.destination.url).pathname.startsWith(this.#path)
            navigateEvent.altRouting.update ??= update;
            //toDo replace with 
            navigateEvent.altRouting.referrer ??= navigation.currentEntry.url;
            console.log(`document referer : ${document.referrer}`)
            console.log(`current entry : ${navigation.currentEntry.url}`)
            //pas forcement le bon referrer avec la cache policy
        }
        
    }
    #isLocalNavigation(navigateEvent)
    {
        //toDo select bonne method http
        let local = true;
        const url = new URL(navigateEvent.destination.url);
        const path = url.pathname;
        const postAttributeSelector = "[data-method='POST']";
        const isPostAttributeSelector = navigateEvent.formData ? `${postAttributeSelector}` : `:not(${postAttributeSelector})`;
        //toDo select bonne method http
        const exactRoute = this.querySelector(`:scope ${namings.components.route}[data-absolute-path="${path}"]${isPostAttributeSelector}`);
        local &&= (exactRoute != null);
        return local;
    }

    #attachViewTransition = (navigateEvent) =>
    {
        //toDo add présnapsot promises
        if(navigateEvent.altRouting.update)
        {
            const precommitHandler = async () =>
            {
                const snapshot = Promise.withResolvers();
                console.group("ViewTransition snapshot");
                
                const navigationFinished = navigation.transition.finished;
                const vtWrapper = async  _ => 
                    {
                        snapshot.resolve()
                        await navigationFinished;
                    }
                console.debug("start viewTransition");
                console.debug("ViewTransition snapshot begin");
                document.startViewTransition(
                    vtWrapper
                );
                console.debug("snapshot current state", snapshot.promise)
                await snapshot.promise;
                console.debug("ViewTransition snapshot done");
                console.groupEnd();//snapshot

            }

            navigateEvent.intercept(
                {
                    precommitHandler
                }
            )
        }
    }

    #routeConstructionEventListener = (e) => 
    {
        e.detail.router = this;
    };

}

customElements.define(namings.components.router, Router, { extends: config.routeur.extends });
