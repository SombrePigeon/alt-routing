import "./shadow.js";
import namings from "../namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : feature/style");

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

const connectComponent = (e) =>
{
    const element = e.target;
    if(element.tagName === namings.components.route.toLocaleUpperCase())
    {
        e.target.addEventListener(namings.events.connectComponent, 
            connectStyleSheet,
            {
                once: true
            });
    }
}

export function addStyleToConnectingRoutes(component)
{
    component.addEventListener(namings.events.connectComponent, 
        connectComponent,
        {
            capture: true,
        });
}
