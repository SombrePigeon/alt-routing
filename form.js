import namings from "./namings.json" with { type: "json" };
import config from "alt-routing/config.json" with { type: "json" };

console.info("alt-routing module init : form");

export default class Form extends HTMLFormElement
{
    #router;
    #_locationMatch;
    #removeListenersController;

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
        
    }

    #connectionEventListener = (e) => 
    {
        if(e.detail.url)
        {
            //rewrite action(absolute)
            const action = this.getAttribute("action");
            this.action = new URL(action, e.detail.url).href;
        }
    };

}

customElements.define(namings.components.form, Form, { extends: "form" });
