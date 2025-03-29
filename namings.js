export default 
{
    enums:
    {
        locationMatch:
        {
            part: Symbol.for("part"),
            exact: Symbol.for("exact"),
            none: Symbol.for("none")
        },
        state: 
        {
            init: Symbol("init"),
            unloaded: Symbol.for("unloaded"),
            loaded: Symbol.for("loaded"),
            loading: Symbol.for("loading"),
            unloading: Symbol.for("unloading"),

        },
        status:
        {
            ok: Symbol.for("ok"),
            ko: Symbol.for("ko"),
            aborted: Symbol.for("aborted"),
        }

    },
    events:
    {
        navigate: "alt-navigate",
        navigated: "alt-navigated",
        routeChange: "alt-route-change",
        connectComponent: "alt-new-routing",

        //routing lifeCycle
        unloaded: "alt-unloaded",
        loaded: "alt-loaded",
        loading: "alt-loading",
        unloading: "alt-unloading",
        //routing infos
        navLoaded: "alt-nav-loaded",
        routingLoaded: "alt-route-loaded",
        //abort request
        abort: "alt-abort",

    },
    components:
    {
        route: "alt-route",
        router: "alt-router",
        anchor: "alt-a",
        title: "alt-title"
    },
    files:
    {
        template: "template.html",
        nav: "nav.html",
        content: "content.html",
        routing: "routing.html",
        title: "title.html",
        style: "style.css"
    }
}