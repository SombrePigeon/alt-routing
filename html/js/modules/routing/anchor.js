import * as namings from "/routing/namings.js"
console.log("anchor");

export default class Anchor extends HTMLAnchorElement
{
    constructor() 
    {
        super()
        //replace 
        this.addEventListener("click", 
            (e) => 
            {
                e.preventDefault();
                console.log("cancel natural navigation, go to : " + this.href + " or "+ this.getAttribute("href"));
                this.dispatchEvent(
                    new CustomEvent(namings.navigateEvent,
                        {
                            bubbles:true,
                            composed: true
                        }
                    )
                );
            });
    }

    connectedCallback()
    {

    }
}
