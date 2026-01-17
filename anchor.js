import namings from "./namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : anchor");

export default class Anchor extends HTMLAnchorElement
{
    #router;
    #_locationMatch;
    #removeListenersController;

    get #locationMatch()
    {
        return this.#_locationMatch;
    }
    set #locationMatch(locationMatch) 
    {
        if(this.#_locationMatch !== locationMatch)
        {
            this.#_locationMatch = locationMatch;
            this.dataset.locationMatch = this.#_locationMatch;
        }
    }

    get locationMatch()
    {
        return this.#_locationMatch;
    }

    connectedCallback()
    {
        removeListenersController = new AbortController();
        this.addEventListener(namings.events.connectComponent, 
            this.#connectionEventListener,
            {
                once: true
            });
        this.dispatchEvent(
            new CustomEvent(namings.events.connectComponent,
                {
                    composed: true,
                    detail: {}//must be initialized
                }
            )
        );
    }

    disconnectedCallback()
    {
        this.#removeListenersController.abort();
    }

    #initNavigationEvent()
    {
        
    }

    #updateLocationMatch = (href) => 
    {
        let match = namings.enums.locationMatch.none;
        //toDo try opti
        if(href.startsWith(this.href))
        {
            if(href === this.href)
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

    #connectionEventListener = (e) => 
    {
        //rewrite href(absolute)
        let href = this.getAttribute("href");
        if(e.detail.url)
        {
            this.href = new URL(href, e.detail.url);
        }
        this.#removeListenersController = new AbortController();
        this.#router = e.detail.router;
        if(config.anchor.showAttribute.locationMatch)
        {
            this.#updateLocationMatch(location.href);
            this.#router?.addEventListener("namings.events.navigate",
                (e)=>
                {
                    this.#updateLocationMatch(e.detail.url.href);
                },
                {
                    signal: this.#removeListenersController.signal
                }
            );
        }
        this.#initNavigationEvent();
    };

}

customElements.define(namings.components.anchor, Anchor, { extends: "a" });
