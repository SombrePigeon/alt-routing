import namings from "./namings.js";

//toDo check use event to trigger
const routeur = document.querySelector(`[is="${namings.components.router}"]`);
if(routeur)
{
    await routeur.routingReady;
}