import * as namings from "./namings.js";
import Router from "./router.js";
import Route from "./route.js";
import Anchor from "./anchor.js";

console.log("init routing elements !")

customElements.define(namings.routerComponent, Router, { extends: "body" });
customElements.define(namings.routeComponent, Route);
customElements.define(namings.anchorComponent, Anchor, { extends: "a" });

