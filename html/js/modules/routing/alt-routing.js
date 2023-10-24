import * as namings from "/routing/namings.js";
import Route from "/routing/route.js";
import Router from "/routing/router.js";
import Anchor from "/routing/anchor.js";

customElements.define( namings.routeComponent, Route);
customElements.define("alt-router", Router, { extends: "body" });
customElements.define("alt-a", Anchor, { extends: "a" });

console.log("init routing elements !")