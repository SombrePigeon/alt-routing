import namings from "./namings.json" with { type: "json" };

console.info("alt-routing module init : title");

export default class Title extends HTMLTitleElement
{
    //callbacks
    connectedCallback()
    {
        const router = document.querySelector(`[is="${namings.components.router}"]`);
        router.routingReady.then(_=>
        {
            navigation?.addEventListener("navigate", 
            this.navigateEventListener);
        });
    }

    disconnectedCallback()
    {
        navigation?.removeEventListener("navigate", this.navigateEventListener);
    }

    navigateEventListener = (navigateEvent) =>
    {
        if(navigateEvent?.altRouting.update)
        {

            const url = new URL(navigateEvent?.destination.url ?? location.href);
            
            const titleURL = new URL(namings.files.title, url);
            
            //toDo check referrer policy
            const referrer = navigateEvent?.altRouting.referrer ?? document.referrer;

            const requestInit = 
            {   
                referrer,
                signal: navigateEvent?.signal,
                redirect: "error" //todo check if good idea
            };

            fetch(titleURL, requestInit)
                .then((response) =>
                {
                    return response.text();
                })
                .then((text) =>
                {
                    this.text = text.trim();
                });
        }
    };
}

customElements.define(namings.components.title, Title, { extends: "title" });
