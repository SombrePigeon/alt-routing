import namings from "./namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : form");

export default class Form extends HTMLFormElement
{
    #router;
    #_locationMatch;
    #base;

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
        this.addEventListener("submit", 
            (e) => 
            {
                if(this.reportValidity())
                {
                    if(this.method === "get")
                    {
                        const action = e.submitter.formaction ?? this.action;
                        const target = e.submitter.formtarget ?? this.target;
                        e.preventDefault();
                        const url = new URL(action, this.#base);
                        const formData = new FormData(this);
                        const search = new URLSearchParams(formData);
                        url.search = search;
                        this.#router.dispatchEvent(
                            new CustomEvent(namings.events.navigate,
                                {
                                    detail:
                                    {
                                        url: url,
                                        target: target,
                                        state: null,
                                        rel: this.rel.split(',')
                                            .filter(r => r === "noopener" || r === "noreferrer")
                                            .join(',')
                                    }
                                }
                            )
                        );
                    }
                    else if(this.method === "post")
                    {
                        //native post but use modified action ? hard and not interesting or reliable
                        //or
                        //fetch emmit alt-form-post-response, if final redirect is get : navigate, else let something use it(notif, popover,...)
                    }
                    else//dialog
                    {
                        //let the submit goes
                    }
                }
            });
    }

    #updateLocationMatch = () => 
    {
        let match = namings.enums.locationMatch.none;
        //toDo try opti
        if(location.href.startsWith(this.action))
        {
            if(location.href === this.action)
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
        if(e.detail.url)
        {
            this.#base = e.detail.url
        }
        
        this.#router = e.detail.router;
        if(config.form.showAttribute.locationMatch)
        {
            this.#updateLocationMatch();
            this.#router?.addEventListener(namings.events.routeChange,
                this.#updateLocationMatch);
        }
        this.#initNavigationEvent();
    };

}

customElements.define(namings.components.form, Form, { extends: "form" });
