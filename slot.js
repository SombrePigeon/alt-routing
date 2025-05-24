import namings from "./namings.js"
console.log("slot module");

export default class Slot extends HTMLSlotElement
{
    #host;
    #query;
    //callbacks
    connectedCallback()
    {
        this.#host = this.getRootNode().host;
        this.#query = `:scope :is(${this.dataset.query ?? "*"}):not(:scope ${namings.components.route} *)`;
        this.assignWithQuery();
        this.#host.addEventListener(namings.events.loaded, 
            this.assignWithQuery);
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
