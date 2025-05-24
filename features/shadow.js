import namings from "../namings.js";
import config from "alt-routing/config";

console.info("alt-routing module init : feature/shadow");

const connectShadow = (e) =>
{
    const element = e.target;

    let useShadow;
    useShadow ??= (element.dataset.useShadow === "true" ? true : undefined);
    useShadow ??= (element.dataset.useShadow === "false" ? false : undefined);
    useShadow ??= config.route.useShadow;

    if(useShadow)
    {
        element.shadowRoot ?? element.attachShadow(config.route.shadowRootInit);

        const componentTemplateAbsolutePath = new URL(namings.files.template, element.url);
        fetch(componentTemplateAbsolutePath)
            .then(response =>
            {
                return response.text();
            })
            .then((html) =>
            {
                element.shadowRoot.innerHTML = html;
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
            connectShadow,
            {
                once: true
            });
    }
}

export function addShadowToConnectingRoutes(component)
{
    component.addEventListener(namings.events.connectComponent, 
        connectComponent,
        {
            capture: true,
        });
}
