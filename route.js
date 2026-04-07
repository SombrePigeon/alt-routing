import namings from "./namings.js";
import config from "alt-routing/config";
import baseComposition from "./composition.json" with { type: "json" };
console.debug("base composition : ", baseComposition)
console.info("alt-routing module init : route");

export default class Route extends HTMLElement
{
    #internals;

    //config
    #isBaseRoute;
    #localNav;
    #staticNav;
    #propagateStaticNav;

    //promises
    #composeReady = Promise.withResolvers();
    #routingReady = Promise.withResolvers();
    
    //attr
    #path;
    #url;
    #router;

    #_locationMatch;
    #_state;
    #_status;

    get composeReady()
    {
        return this.#composeReady.promise;
    }
    get routingReady()
    {
        return this.#routingReady.promise;
    }

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

    get router()
    {
        return this.#router;
    }

    get staticNav()
    {
        return this.#staticNav;
    }
    
    //callbacks
    connectedCallback()
    {
        this.#internals = this.attachInternals();
        this.#state = namings.enums.state.init;
        this.#status = "";
        
        this.#path = this.dataset.path;
        this.#isBaseRoute = this.#path.startsWith('/');//toDo check si suffisant
        //init attributes

        if(this.#isBaseRoute)
        {
            this.addEventListener(namings.events.connectComponent,
                this.#routerConstructionEventListener,
                {
                    capture: true
                }
            );
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
        this.#router.removeEventListener(namings.events.navigate, this.updateLocationMatch);
        this.dispatchEvent(namings.events.disconnectComponent);
    }

    async update(navigateEvent)
    {
        //attach callback to navigate
        console.debug(`${this.#url} will try to update`);
        let match = namings.enums.locationMatch.none;
        const url = new URL(navigateEvent?.destination.url ?? location.href);
        //toDo try opti
        if(url.pathname.startsWith(this.#url.pathname))
        {
            if(url.pathname === this.#url.pathname)
            {
                match = namings.enums.locationMatch.exact;
            }
            else
            {
                match = namings.enums.locationMatch.part;
            }
        }
        //toDo conditionnal loaging
        const composition = await this.composeReady;
        const fragmentsNames = composition.order;
        const fragmentsModels = composition.models;

        const fragmentsUpdated = [];
        for(const name of fragmentsNames)
        {
            
            const model = fragmentsModels[name];
            const isStatic = model.static;
            const navigation = navigateEvent != null;
            const update = !(isStatic && navigation);
            
            if(update)
            {
                const show = isStatic || model.loading.includes(match);
                if(show)
                {
                    fragmentsUpdated.push(this.loadFragment(name, navigateEvent));
                }
                else
                {
                    fragmentsUpdated.push(this.unload(name));
                }
            }
        }
        await Promise.all(fragmentsUpdated);
        this.#locationMatch = match;
        await this.loaded(navigateEvent);

    }

    async loaded(navigateEvent)
    {
        
        //loaded Event
        const loaded = Promise.withResolvers();
        
        this.addEventListener(namings.events.loaded, e =>
            {
                e.stopPropagation();
                loaded.resolve();
            },
            {
                once: true,
                signal: navigateEvent?.signal 
            }
        );

        const target = this.shadowRoot ?? this;
        
        await this.routingReady;

        target.dispatchEvent(new CustomEvent(namings.events.loaded,
            {
                bubbles: true,
                composed: true
            }
        ));
        await loaded.promise;
    }

    async loadFragment(fragmentsName, navigateEvent)//optionnal param
    {
        const fragmentPromise = this.fetchFragment(fragmentsName, navigateEvent);
        //toDo handle post redirect
        const fragmentResponse = await fragmentPromise;
        const insert = true;//not if 304 and already loaded
        if(insert)
        {
            this.#status = fragmentResponse.status;
            const html = await fragmentResponse.text();

            //toDo import TTP and use it with arg (path, fragmentName)
            const trusted_html = html;

            await this.#insertFragment(fragmentsName, trusted_html);
            //toDo si routing set routing ready
            if(fragmentsName === "routing.html")
            {
                const promises = [];
                for(const route of this.querySelectorAll("alt-route"))
                {
                    promises.push(route.routingReady);
                }
                this.#routingReady.resolve(Promise.all(promises));
            }
        }
    }

    async fetchFragment(fragmentsName, navigateEvent)
    {
        //request setup
        const abortSignal = navigateEvent?.signal;//toDo add pageclose signal ? auto abort de base ?
        //toDo check referrer policy
        const referrer = navigateEvent?.altRouting.referrer ?? document.referrer
        //toDo check if locations is already modified 
        const composition = await this.composeReady;
        const model = composition.models[fragmentsName];
        const requestInit = 
            {   
                //toDo try not using data added to navigateEvent.altRouting
                referrer,
                signal: abortSignal,
                redirect: model.canRedirect ? "manual" : "error" //todo check if good idea
            };

        const url = new URL(navigateEvent?.destination.url ?? location.href);
        
        const contentURL = new URL(fragmentsName, this.#url);

        if(model.useSearchParam)
        {
            contentURL.search = url.search;
        }
        const contentRequest = new Request(contentURL, requestInit);
        const response = await fetch(contentRequest);

        return response;
    }


    //state listeners
    //onLoaded
    async #insertFragment(name, html)
    {
        const composition = await this.composeReady;
        
        await this.#removeFragment(name);

        const range = composition.ranges[name];

        const template = document.createElement('template');
        template.setHTMLUnsafe(html);
        range.insertNode(template.content);
    }


    async unload(fragmentName)
    {
        this.#status = "" ;
        await this.#removeFragment(fragmentName);
    }
    
    //onUnloaded
    async #removeFragment(name)
    {
        console.debug( `remove frament : ${name} from route `, this);
        const composition = await this.composeReady;

        const range = composition.ranges[name];

        range.deleteContents();
    }

    //methods
    #routerConstructionEventListener = (e) => 
    {
        e.detail.url = new URL(location.origin);
    };

    #constructionEventListener = (e) => 
    {
        e.detail.url = new URL(this.#path, e.detail.url);
        if(this.#propagateStaticNav != null)
        {
            if(this.#propagateStaticNav)
            {
                e.detail.staticNav = this.#staticNav;
            }
            else
            {
                delete e.detail.staticNav;
            }
        }
    };

    #connectionEventListener = (e) => 
    {
        
        this.#url = e.detail.url;
        this.dataset.absolutePath = this.#url.pathname;
        this.#router = e.detail.router;

        this.#router.addEventListener(namings.events.navigate,
            this.update());//bad !

        this.#initComposition();
        
        //toDo remove when routing done with fragment
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

        this.#state = namings.enums.state.unloaded;//toDo check si ça sert encore 

        //listen navigate event
        if(navigation)
        {
            console.debug("init navigation event");
            navigation?.addEventListener("navigate", this.#navigateEventListener);
        }
    };

    async #initComposition()
    {
        const composition = structuredClone(baseComposition);
        //toDo replace by composition init (with fetch) and do better namings

        composition.ranges = {};

        for(const framentName of composition.order)
        {
            const fragmentTag = document.createComment(framentName);
            this.appendChild(fragmentTag);

            const range = new Range();
            composition.ranges[framentName] = range;
            range.setStartAfter(fragmentTag);
        }
        this.#composeReady.resolve(composition);

    }

    #navigateEventListener = (navigateEvent) =>
    {
        if(navigateEvent?.altRouting.update)
        {
            const handler = async _ =>
            {
                await this.update(navigateEvent)
            }
            navigateEvent.intercept(
                {
                    handler
                }
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
