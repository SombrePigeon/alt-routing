import * as namings from "/routing/namings.js";
import Router from "/routing/router.js";
import Route from "/routing/route.js";
import Anchor from "/routing/anchor.js";

console.log("init routing elements !")

customElements.define(namings.routerComponent, Router, { extends: "body" });
customElements.define(namings.routeComponent, Route);
customElements.define(namings.anchorComponent, Anchor, { extends: "a" });

