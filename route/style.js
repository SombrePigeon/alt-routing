import namings from "../namings.js";
import "./shadow.js"
import config from "alt-routing/config";

const routesStyleSheet = new CSSStyleSheet();

if (config.route.style)
{
    fetch(config.route.style)
    .then((response) => 
    {
        return response.text();
    })
    .then((style) =>
    {
        routesStyleSheet.replace(style);
    });
}


const connectStyleSheet = (e) =>
{
    const element = e.target;

    if(element.shadowRoot)
    {
        const componentStyleAbsolutePath = new URL(namings.files.style, element.url);

            const localSheet = new CSSStyleSheet();
            element.shadowRoot.adoptedStyleSheets = [routesStyleSheet, localSheet];
            fetch(componentStyleAbsolutePath)
                .then(response =>
                {
                    return response.text();
                })
                .then((css) =>
                {
                    localSheet.replace(css);
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
            connectStyleSheet,
            {
                once: true
            });
    }
}

console.log("styleRoutes module");
console.debug("must appear before route module");
document.body.addEventListener(namings.events.connectingRoutingComponent, 
    connectingRoutingComponent,
    {
        capture: true,
    });
