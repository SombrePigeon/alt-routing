import * as namings from "/routing/namings.js"
console.log("anchor module");

export default class Anchor extends HTMLAnchorElement
{

    constructor() 
    {
        super()
        //when initialisez : 
        this.addEventListener(namings.connectedRoutingComponentEvent, 
            (e) => 
            {
                //set new href
                this.href = e.detail.path + this.getAttribute("href");
                console.log("anchor is connected ");
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
                                    href: this.href
                                }
                            }
                        )
                    );
                });
                //disconnect this event
            });
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
}
