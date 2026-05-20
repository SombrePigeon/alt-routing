import namings from "./namings.js";

const {promise, resolve} = Promise.withResolvers();

export default promise;

const routeur = document.querySelector(`[is=${namings.components.router}]`);
if(routeur)
{
    await customElements.whenDefined(namings.components.router);
    await routeur.initialLoadDone;
    resolve();
}
