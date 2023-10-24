import * as namings from "/routing/namings.js";


export function getDirectRoutesElements(node)
{
    return node.querySelectorAll(
        //namings.routeComponent + ":not("+ namings.routeComponent + " " + namings.routeComponent + ")"
        namings.routeComponent
        );
}



export function setAbsolutePath(component, basePath)
{
    const path = component.getAttribute(attributePath);
    component.setAttribute(namings.attributeAbsolutePath,basePath + path);
    
}