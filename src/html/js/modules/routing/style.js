import config from "./config.js";

const styles =
{
    global: new CSSStyleSheet(),
    route: new CSSStyleSheet()
}
export default styles;

fetch(config.style.global)
.then((response) => 
{
    return response.text();
})
.then((style) =>
{
    styles.global.replace(style)
})

fetch(config.style.route)
.then((response) => 
{
    return response.text();
})
.then((style) =>
{
    styles.route.replace(style)
})