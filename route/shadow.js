import namings from "../namings.js";
import config from "alt-routing/config";

const connectShadow = (e) =>
{
    const element = e.target;

    let useShadow;
    useShadow ??= (element.dataset.useShadow === "true" ? true : undefined);
    useShadow ??= (element.dataset.useShadow === "false" ? false : undefined);
    useShadow ??= config.route.useShadow;
    debugger
    if(useShadow)
    {
        element.shadowRoot ?? element.attachShadow(config.route.shadowRootInit);

        const componentTemplateAbsolutePath = new URL(namings.files.template, element.url);
        fetch(componentTemplateAbsolutePath)
            .then(response =>
            {
                debugger
                return response.text();
            })
            .then((html) =>
            {
                debugger
                element.shadowRoot.innerHTML = html;
            }
        );
    }
}

const connectingRoutingComponent = (e) =>
{
    const element = e.target;
    if(element.tagName === namings.components.route.toLocaleUpperCase())
    {
        e.target.addEventListener(namings.events.connectingRoutingComponent, 
            connectShadow,
            {
                once: true
            });
    }
}

console.log("shadowRoutes module");
console.debug("must appear before route module");
document.body.addEventListener(namings.events.connectingRoutingComponent, 
    connectingRoutingComponent,
    {
        capture: true,
    });