import namings from "./namings.js"
console.debug("source module");

export default class Source extends HTMLSourceElement
{
    constructor() 
    {
        super();
        //init callback
        this.addEventListener(namings.events.connectingRoutingComponent, 
            this.connectionEventListener,
            {
                once: true
            });
    }

    //callbacks
    connectedCallback()
    {
        console.debug("source is connecting " );
        this.dispatchEvent(
            new CustomEvent(namings.events.connectingRoutingComponent,
                {
                    composed: true,
                    detail: {}//must be initialized
                }
            )
        );
    }

    //eventsListeners
    connectionEventListener = (e) => 
    {
        //rewrite src and srcset
        let src = this.getAttribute("src");
        let srcset = this.getAttribute("srcset");
        //src
        if(e.detail.url)
        {
            //src
            if(src)
            {
                this.src = new URL(src, e.detail.url);
            }
            //srcset
            if(srcset)
            {
                this.srcset = srcset.split(',').flatMap(source => 
                {
                    source = source.split(' ');
                    source[0] = new URL(source[0], e.detail.url).href;
                    return source;
                }).join();
            }
        }
        console.debug(`source "${this.srcset}","${this.src}" is connected `);
    };

}

customElements.define(namings.components.source, Source, { extends: "source" });
