/**
 * _Contutus handles syncrozing path changes between Contutus instances
 */
let _Contutus = {
    registered: [],

    /**
     * Register a path or paths to be used by Contutus
     * @global
     * @param {Contutus} instance - The instance of Contutus to register
     * @example
     * _Contutus.registerInstance(view);
     */
    registerInstance: async function(instance){
        this.registered.push(instance);
        await instance.routeTo(window.location.hash);
    }
};

window.addEventListener('hashchange', async function(){
    for (let instance of _Contutus.registered){
        await instance.routeTo(window.location.hash);
    }
}, false);

if (window.location.hash == "")
    window.location.hash = "/";

/**
 * An instance of Contutus handles the rendering of a single element based on the current path
 * @example
 * let view = new Index(document.getElementById("main"));
 */
class Contutus {
    element;
    routeTable = {

    }

    /**
     * New instance of Contutus
     * @constructor
     * @param {Object} element - The element this instance controls.
     */
    constructor(element) {
        this.element = element;
    }

    /**
     * Register a path or paths to be used by Contutus
     * @method
     * @param {Object} routes - The path and corresponding render function alongside any metadata
     * @example
     * view.registerPath({"/": [generatePage, "Home"]});
     * @example
     * view.registerPath({"/beep": generatePage});
     */
    registerPath(routes){
        for (let path in routes) {
            let routeData = routes[path];
            let pathSplit = path.split("/");
            pathSplit.shift();

            this.recursiveRouteInsert(pathSplit, routeData, this.routeTable);
        }
    }

    recursiveRouteInsert(pathSplit, routeData, routeTableLocation){
        if (pathSplit.length == 1){
            routeTableLocation[pathSplit[0]] = routeData;
        } else {
            if (routeTableLocation[pathSplit[0]] == undefined){
                routeTableLocation[pathSplit[0]] = {};
            }
            let newRouteTableLocation = routeTableLocation[pathSplit[0]];
            pathSplit.shift();
            this.recursiveRouteInsert(pathSplit, routeData, newRouteTableLocation);
        }
    }

    /**
     * go to the specified path
     * @method
     * @param {String} path - The path to navigate to
     * @example
     * view.routeTo("/hello");
     */
    async routeTo(path){
        let pathSplit = path.split("/");
        pathSplit.shift();

        let routeTableLocation = this.routeTable;
        let newView;
        let routeToRun;
        let current404 = routeTableLocation["$404$"];

        // lets find the route to run
        while (!routeToRun) {
            if (pathSplit.length == 1) {

                let currentRoute = routeTableLocation[pathSplit[0]];

                if (currentRoute == undefined) {
                    routeToRun = current404;
                    break;
                }

                if (!Array.isArray(currentRoute) && typeof currentRoute == "object"){
                    if (currentRoute[""]){
                        currentRoute = currentRoute[""];
                    } else {
                        routeToRun = current404;
                        break;
                    }
                }

                routeToRun = currentRoute;

                break;

            } else {
                let currentRoute = routeTableLocation[pathSplit[0]];

                if (currentRoute == undefined) {
                    routeToRun = current404;
                    break;
                }

                if (currentRoute["$404$"]){
                    current404 = currentRoute["$404$"];
                }

                routeTableLocation = currentRoute;
                pathSplit.shift();
            }
        }

        // Lets run routeToRun
        if (typeof routeToRun == "function")
            newView = await routeToRun(path);

        if (Array.isArray(routeToRun))
            newView = await routeToRun[0](path, routeToRun.slice(1));

        // Now lets set the new contents
        while(this.element.firstChild) {
            this.element.removeChild(this.element.firstChild);
        }
        this.element.appendChild(newView);

    }

}

console.log('Index has loaded :)');