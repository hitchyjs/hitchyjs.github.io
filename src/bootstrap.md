## Bootstrap


### Introduction

On startup hitchy is detecting and collecting all required information to properly handle incoming requests later. This stage is called _bootstrap_ and must be completed without any error. This page provides in-depth explanation of bootstrap process.


### Triangulation

First of all hitchy is trying to detect its runtime environment detecting all basically required information such as current project's folder etc. This is primarily achieved by inspecting the options provided on injecting hitchy into your application. If those options don't select any project folder the triangulation is starting to search for obvious project folders to depend on hitchy starting in current working directory or in folder containing file used to start current nodejs runtime (the main file). If this doesn't lead to detection of obvious root folder the project containing current hitchy working copy in its `node_modules` hierarchy is searched.

As a result of triangulation hitchy knows two folders:

* `<hitchyFolder>` is the folder containing hitchyjs framework installation. This information is available as `options.hitchyFolder` on complying with common module pattern.
* `<projectFolder>` is the folder containing custom implementation relying on hitchyjs as well as a custom set of extending components (a.k.a. extensions). On using common module pattern this pathname is available via `options.projectFolder`.


### Discovery 

After triangulation hitchy is trying to discover all compatible components in `<projectFolder>` and components distributed with hitchy framework itself as its core components in `<hitchyFolder>`. The former are expected as installed npm packages under `<projectFolder>/node_modules`. The latter are read from `<hitchyFolder>/core`.

Any component is considered compatible with hitchyjs on providing special file `hitchy.json` in its root folder. This file is providing optional information on component. It might be empty by default (though, as a valid JSON file it should contain some empty object at least). It is always required as such so hitchy is considering containing package compatible.

Every discovered valid component is loaded then. Either component is expected to provide a set of functions and meta information to be obeyed in one of several bootstrap stages performed sequentially afterwards. Every component might rely on common module pattern here.


#### Steps of Discovery

1. **Collect:** Folders mentioned before are shallowly searched for sub folders containing `hitchy.json` file. Any found `hitchy.json` file is read and a handle describing the component and its meta data (which is the content of `hitchy.json` file) is appended to a collection of handles of basically discovered components.
   > **Always consider such handles as read-only information!**
   > 
   > For the sake of performance and reduced memory footprint handles might be shared between requests during bootstrap so changing handles might be possible. But this isn't guaranteed behaviour. Don't use it for session data or controlling discovery e.g. by adjusting foreign component's handle etc. 
2. All handles are compiled in a map to look up handles by component's name.
3. **Load:** Collection of handles is used to load every component and to request its API. This happens sequentially, but in unspecified order.
   * This request is providing map compiled before basically for detecting what components are available. By using _common module pattern_ any component may implement decisive code providing API functions and some meta data overlay to replace parts of its meta data read from `hitchy.json` file before. _Component mustn't rely on these handles providing any listed component's API as they do later._
   * The declaration of a component's role is processed immediately after gathering its API.
   * Any component may export its API as such or stick with common module pattern. In the latter case exporting function of module is invoked with two additional arguments:
     1. `options` is provided as first argument in compliance with common module pattern.
     2. `mapOfComponents` is referring to the map of components' names into either component's handle.
     3. `handle` is referring to (read-only) handle of component itself e.g. for accessing meta data read from `hitchy.json` file via `handle.meta`.
4. After having requested all discovered components' APIs all components still filling some role are notified. This notification is enabling either component to gather and save access on APIs of components it is replacing prior to dropping the latter.
5. **Sort:** Every component is expected to list roles of components it depends on. This information is used to deduce a certain order of processing components further on ensuring that any component is processed after those components it depends on.
6. **Publish:** Eventually, APIs of all components still filling a role are promoted in `api.components` using role of component as key, so that component `hitchy-foo` declaring to fill role `bar` is available under `api.components.bar`.


#### Name vs. Role

Every component is having a **name** matching basename of folder containing the component. So, if there is an component in `<projectFolder>/node_modules/hitchy-foo` the component's name is `hitchy-foo`. Names are used to identify components. The name must be unique in a single applicaton relying on hitchy. It should be even globally unique. During discovery any component gets informed on what other components are about to be loaded. The name is designed to provide opportunity to safely detect availability of a certain component to rely on.

Every component may declare some **role** it is filling, too. By default a component's role is equivalent to its name. Any component may declare different role in its `hitchy.json` file. Such a declaration is called _static declaration_ of role. On loading component to gather its API this API might include meta information to replace related information read from `hitchy.json` file before. This includes declaration of role. Re-declaring role this way is called _dynamic declaration_ of role.

Roles are used on processing dependencies between hitchy components resulting in a certain order of processing components in every stage of bootstrapping hitchy.

> In fact, all succeeding stages rely on order detected in discovery stage. All but shutdown stage process include components in this same way. Shutdown stage is using reverse order to shut down components.

Any dynamic declaration of a role supersedes its static declaration. In addition it replaces static declaration of same role in any other component discovered before. Eventually any role mustn't be filled by more than one component in a single hitchy-based application. Thus bootstrapping fails if two components _dynamically_ declare to fill the same role. 


#### Overriding

hitchy features _component overloading_ by design. Most of this is prepared in discovery stage.

* By dynamically declaring commonly used role any component might replace default component used otherwise.
* Every component gets information about all other discovered components. Thus either component is enabled to dynamically declare a role depending what other components are available.
* At end of discovery all components with roles replaced by other components get dropped, but prior to that every component with API function `onDiscovered()` is provided with APIs of all components basically discovered before to gather access on API of components it is replacing.


### Configuration

In configuration stage all configuration provided in project is loaded and merged. The result configuration is an object with every immediate property containing to content provided in one of several files located in subfolder `config` of current project. Every file is expected to provide some data to become value of related property.

This configuration is commonly available in `api.runtime.config`.

After all custom configuration has been compiled all discovered components are invoked to process this compiled configuration e.g. by adjusting, validating, normalizing, converting, replacing any contained information.

Every component may export function `configure()` to be invoked during this stage of bootstrap. This method is invoked with 

* `this` referring to `api`, 
* `options` in first parameter (similar to common module pattern) and 
* information on component including its meta data read from its `hitchy.json` file before in second parameter. 

> Providing `api` and `options` here is a bit redundant, but makes component coding slightly more flexible. Finally it doesn't hurt either.

The method `configure()` might return promise to delay further configuration in particular and bootstrap in general.

```javascript
module.exports = function( options ) {
	let api = this;
	
	return {
		configure: function( options, componentHandle ) {
			// TODO put your configuration processing here
		}
	};
};
```

> At end of bootstrap the API will be sealed deeply to prevent accidental modifications of this configuration during actual runtime of your hitchy-based application. Thus you should do all required qualifcation of configuration data here.

When all configuration has been qualified bootstrap process is loading all models, controllers, policies and services provided by component, again obeying order resulting from discovery before as well as supporting hitchy's common module pattern. 

So, if you have components `foo` and `bar` with `foo` listing `bar` as its dependency then

* all models of `bar` are loaded in unspecified order,
* all controlllers of `bar`are loaded in unspecified order,
* all policies of `bar` are loaded in unspecified order,
* all services of `bar` are loaded in unspecified order,
* all models of `foo` are loaded in unspecified order,
* all controlllers of `foo`are loaded in unspecified order,
* all policies of `foo` are loaded in unspecified order and
* all services of `foo` are loaded in unspecified order.

Those models, controllers, policies and services are located in folder `api/models`, `api/controllers`, `api/policies` and `api/services` of either component. Any model, controller, service or policy might use function according to _common module pattern_. In that case any previous state of a model, controller, etc. with the same name (e.g. as provided by another component before) is provided in second parameter so the function may extend that one's functionality.

Results are cumulated and finally available in `api.runtime.models`, `api.runtime.controllers`, `api.runtime.policies` and `api.runtime.services`. Either element's name is derived from basename of related file without adjusting case or similar except for stripping off extension `.js`.


### Initialization

After configuration stage all component are initialized. This stage is primary useful to process all configuration and handle described models etc. e.g. for preparing data storage backend to match schema described by models.

Just like in configuration stage every component may export function `initialize()` to be invoked during this stage of bootstrap. This method is invoked with the same arguments described on configuration stage before. It also might return promise to delay further initialization in particular and bootstrap in general.

```javascript
module.exports = function( options ) {
	let api = this;
	
	return {
		initialize: function( options, componentHandle ) {
			// TODO put your component's initialization code here
		}
	};
};
```


### Routing

When initialization is done the routing is established. Therefore every component may provide sets of routing definitions to precede or succeed custom routings of current project (as given in configuration `api.runtime.config.routing`) and automatic blueprint routing e.g. derived from controllers provided before.

hitchy manages two separate sets of routes: one for policies and one for controllers. Therefore any module may provide separate sets of routes by epxorting `policies` for policy-related routing provision and `routing` for controller-related routing provision. Either information is expected to be object containing one or two properties called `before` and `after` with each providing map of routing patterns into routing target descriptions. All routings provided in `before` are preceding routes found in project configuration and blueprint routes. All routings provided in `after` are processed after those routes. 

> Later requests are passing *all* matching routes related to policies prior to find the first matching route related to some controller to finally handle the request.

Every single route is defined as a route pattern mapping onto description of a routing target. 

The route pattern is a URL pattern optionally prepended by name of some HTTP method this particular route is valid for. If method name is omitted the route is processed on any HTTP request method.

The routing target is either
 
* a string containing names of a controller and one of its static methods separated by single period or
* an object providing name of controller and its static method in separate properties `controller` and `method` or
* a function to be directly associated with processing the request.

In policy-related either routing target is invoked with three parameters `req`, `res` and `next` in accordance with usual pattern introduced by expressjs and its predecessors. In controller related routing the third parameter is omitted as the routing target is expected to respond to solely the request.

In either routing the invoked routing target is invoked with `this` referring to the current request context which is providing additional information:

* `this.api` is referring to hitchy's API. This is the same provided on following common module pattern described above.
* `this.request` is referring to same object as first provided argument.
* `this.response` is referring to same object as second provided argument.
* `this.data` is an initially empty object available to store arbitrary data associated with current request e.g. to collect session data in early policy-related routing processors so its availale in later routing processors.

Any routing target might return promise to delay further processing. **In policy-related routing returning promises is available if method isn't taking third parameter mentioned above (`next`).**
