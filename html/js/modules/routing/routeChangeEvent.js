import { routeChangeEvent } from "/routing/namings.js";

export function getRouteChangeEvent(path)
{
    return new CustomEvent(routeChangeEvent);
}