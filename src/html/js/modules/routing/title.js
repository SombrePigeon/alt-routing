import namings from "./namings.js"
console.log("title module");

export default class Title extends HTMLTitleElement
{
    #abortController;
    //callbacks
    connectedCallback()
    {
        console.log("title is listening " );
        document.body.addEventListener(namings.events.routeChange, 
            this.routeChangeEventListener,
            {
                capture: true,
            });
    }

    disconnectedCallback()
    {
        document.body.removeEventListener(namings.events.routeChange, this.routeChangeEventListener);
    }

    routeChangeEventListener = (e) =>
    {
        const titleAbsolutePath = location.pathname + namings.files.title;
        this.#abortController?.abort();
        this.#abortController = new AbortController();

        fetch(titleAbsolutePath,
            {
                signal: this.#abortController.signal
            })
            .then((response) =>
            {
                return response.text();
            })
            .then((text) =>
            {
                this.text = text;
            })
            .finally(()=>
            {
                this.#abortController = null;
                console.log(`title update : ${this.text}`);
            });
        
    };
}

customElements.define(namings.components.title, Title, { extends: "title" });
