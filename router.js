import namings from "./namings.json" with { type: "json" };
import Route from "./route.js";//required
import config from "alt-routing/config.json" with { type: "json" };

console.info("alt-routing module init : router");

const ParentClass = document.createElement(config.routeur.extends).constructor;

export default class Router extends ParentClass
{
    #path;
    #routingReady = Promise.withResolvers();
    #serviceWorkerUpdated = false;

    get routingReady()
    {
        return this.#routingReady.promise;
    }

    connectedCallback()
    {
        const origin = location.origin;
        const path = this.getAttribute("path") ?? '/';//toDo info 
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
            if(config.routeur.viewTransition)
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
                this.#routingReady.resolve();
                //navigation.addEventListener("navigate", this.#afterNavigateEventListener);
            }
        )

        navigator.serviceWorker?.addEventListener("controllerchange", 
            _ =>
            {
                console.info(`serviceWorker changed, alt-routing will not capture next navigate event.`)
                this.#serviceWorkerUpdated = true;
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
            const oldAltRouting = navigateEvent?.info?.altRouting;
            delete oldAltRouting.update;//we don't want old update 
            navigateEvent.altRouting ??= {};
            navigateEvent.altRouting = {...oldAltRouting ,...navigateEvent.altRouting}
            const update = navigateEvent.canIntercept 
            && navigateEvent.navigationType !== "reload"
            && !navigateEvent.hashChange 
            && !navigateEvent.downloadRequest
            && this.#isLocalNavigation(navigateEvent)
            //remove next line, routeur checkif a route match
            && new URL(navigateEvent?.destination.url).pathname.startsWith(this.#path)
            navigateEvent.altRouting.update ??= update;
        }
        
    }
    #isLocalNavigation(navigateEvent)
    {
        //toDo select bonne method http
        let local = true;
        const url = new URL(navigateEvent.destination.url);
        const path = url.pathname;
        const postAttributeSelector = "[method='POST']";//toDo remove
        const isPostAttributeSelector = ""; //navigateEvent.formData ? `${postAttributeSelector}` : `:not(${postAttributeSelector})`;
        //toDo select bonne method http
        const exactRoute = this.querySelector(`:scope ${namings.components.route}[data-absolute-path="${path}"]${isPostAttributeSelector}`);
        local &&= (exactRoute != null);
        local &&= !this.#serviceWorkerUpdated;
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

    #serviceWorkerUpdate()
    {
        this.#serviceWorkerUpdated = true;
    }

}

customElements.define(namings.components.router, Router, { extends: config.routeur.extends });
