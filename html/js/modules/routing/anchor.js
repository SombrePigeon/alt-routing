import * as namings from "/routing/namings.js"
console.log("anchor module");

export default class Anchor extends HTMLAnchorElement
{
    connectionEventListener = (e) => 
    {
        //set new href(absolute) 
        let href = this.getAttribute("href");
        this.href = e.detail.path + '/' + href;
        console.log("anchor is connected ");
        this.initNavigationEvent();
        this.removeEventListener(namings.connectedRoutingComponentEvent, this.connectionEventListener);
    };

    constructor() 
    {
        super();
        //when initialisez : 
        if(this.getAttribute("href").startsWith('/'))
        {
            this.initNavigationEvent();
        }
        else
        {
            this.addEventListener(namings.connectedRoutingComponentEvent, 
                this.connectionEventListener);
        }
    }

    connectedCallback()
    {
        console.log("anchor is connecting " );
        this.dispatchEvent(
            new CustomEvent(namings.connectingRoutingComponentEvent,
                {
                    bubbles:true,
                    composed: true,
                    detail:
                    {
                        src: this
                    }
                }
            )
        );
    }

    initNavigationEvent()
    {
        this.addEventListener("click", 
        (e) => 
        {
            e.preventDefault();
            console.log("cancel natural navigation, go to : " + this.href + " or "+ this.getAttribute("href"));
            this.dispatchEvent(
                new CustomEvent(namings.navigateEvent,
                    {
                        bubbles:true,
                        composed: true,
                        detail:
                        {
                            pathname: this.pathname,
                            search: this.search,
                            hash: this.hash,
                            state: null
                        }
                    }
                )
            );
        });
    }
}
