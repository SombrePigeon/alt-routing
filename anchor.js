import namings from "./namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : anchor");

export default class Anchor extends HTMLAnchorElement
{
    #router;
    #_locationMatch;

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
        this.#router?.removeEventListener(namings.events.routeChange, this.routeChangeEventListener);
    }

    #initNavigationEvent()
    {
        if(!this.getAttribute(this.download))
        {
            this.addEventListener("click", 
            (e) => 
            {
                e.preventDefault();
                this.#router.dispatchEvent(
                    new CustomEvent(namings.events.navigate,
                    {
                        detail:
                        {
                            url: new URL(this.href),
                            target: this.target,
                            state: null,
                            rel: this.rel.split(',')
                                .filter(r => r === "noopener" || r === "noreferrer")
                                .join(',')
                        }
                    }
                    )
                );
            });
        }
    }

    #updateLocationMatch = () => 
    {
        let match = namings.enums.locationMatch.none;
        //toDo try opti
        if(location.href.startsWith(this.href))
        {
            if(location.href === this.href)
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
        
        this.#router = e.detail.router;
        if(config.anchor.showAttribute.locationMatch)
        {
            this.#updateLocationMatch();
            this.#router?.addEventListener(namings.events.routeChange,
                this.#updateLocationMatch);
        }
        this.#initNavigationEvent();
    };

}

customElements.define(namings.components.anchor, Anchor, { extends: "a" });
