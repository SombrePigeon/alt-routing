import namings from "./namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : slot");

if(config.route.shadowRootInit.slotAssignment !== "manual")
{
    console.error("alt-routing slot require config 'route.shadowsRootInit.slotAssignment !== 'manual'");
}

export default class Slot extends HTMLSlotElement
{
    #host;
    #query;

    connectedCallback()
    {
        this.#host = this.getRootNode().host;
        this.#query = `:scope :is(${this.dataset.query ?? "*"}):not(:scope ${namings.components.route} *)`;
        this.assignWithQuery();
        this.#host.addEventListener(namings.events.loaded, 
            this.assignWithQuery);
        if(this.#host.staticNav)
        {
            this.#host.addEventListener(namings.events.navLoaded, 
            this.assignWithQuery,
            {
                once: true
            });
        }
        if(this.#host.staticRouting)
        {
            this.#host.addEventListener(namings.events.routingLoaded, 
            this.assignWithQuery,
            {
                once: true
            });
        }
    }

    disconnectedCallback()
    {
        this.#host.removeEventListener(namings.events.loaded, this.assignWithQuery);
    }

    assignWithQuery = (e) =>
    {
        this.assign(...this.#host.querySelectorAll(this.#query));
    }
}

customElements.define(namings.components.slot, Slot, { extends: "slot" });
