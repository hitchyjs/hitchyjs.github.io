## Bootstrap

On startup hitchy is detecting and collecting all required information to properly handle incoming requests later. This stage is called _bootstrap_ and must be completed without any error. This page provides in-depth explanation of bootstrap process.

> If you are new to hitchy you might need to learn some key [concepts](concepts.md), first, to understand this explanation.

Bootstrap is divided into sequentially processed stages:

1. Triangulation
2. Discovery
3. Configuration
4. Exposition
5. Initialization
6. Routing

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

1. **Collect:** Folders mentioned before are shallowly searched for sub folders containing `hitchy.json` file. Any found `hitchy.json` file is read and a handle describing the component and its meta data (which is the content of `hitchy.json` file) is appended to a list of handles of basically discovered components.
   > **Always consider such handles as read-only information!**
   > 
   > For the sake of performance and reduced memory footprint handles might be shared between requests during bootstrap so changing handles might be possible. But this isn't guaranteed behaviour. Don't use it for session data or controlling discovery e.g. by adjusting foreign component's handle etc.
2. All handles are compiled in a map to look up handles by component's name.
3. **Load:** The list of handles compiled in first step is used to load every component and to request its API. This happens sequentially, but in unspecified order.
   * Any component may export its API as such or stick with common module pattern. 
   * When complying with common module pattern the exporting function of component is considered to be common module pattern function with these additional arguments:
     1. `mapOfComponents` is referring to the map of components' names into either component's handle as compiled in step two above.
     3. `handle` is referring to (read-only) handle of component itself e.g. for accessing meta data read from `hitchy.json` file via `handle.meta`.
     
     This way any component may implement decisive code providing API consisting of functions and some meta data overlay to replace parts of component's original meta data read from `hitchy.json` file before.
     > _At this stage no component should rely on any handle providing related component's API._ See fourth step below instead.
   * The eventual declaration of a component's role is processed immediately after gathering its API.
4. After having requested all discovered components' APIs all components still filling some role are notified. This notification is enabling either component to gather and save access on APIs of components it is replacing prior to dropping the latter.

   A component in this notification is exporting function `onDiscovered()` to be invoked now. Invocation is equivalent to step 3 described above, but this time code may rely on provided map containing all listed components' APIs.
   
   Due to this pattern any component waiting for invocation of its `onDiscovered()` function is also capable of realizing that it is actually used to fill the role it has declared before. And it gets a last chance to access any other component that has been competing with current one in this.
5. **Sort:** Every component is expected to list roles of components it depends on. This information is used to deduce a certain order of processing components further on ensuring that any component is processed after those components it depends on.
6. **Publish:** Eventually, APIs of all components still filling a role are promoted in `api.components` using role of component as key, so that component `hitchy-foo` declaring to fill role `bar` is available under `api.components.bar`.


#### Name vs. Role

Every component is having a **name** matching basename of folder containing the component. So, if there is an component in `<projectFolder>/node_modules/hitchy-foo` the component's name is `hitchy-foo`. Names are used to identify components. The name must be unique in a single applicaton relying on hitchy. It should be even globally unique. During discovery any component gets informed on what other components are about to be loaded. The name is designed to provide opportunity to safely detect availability of a certain component to rely on.

Every component may explicitly declare some **role** it is filling, too. By default a component's role is equivalent to its name. Any component may declare different role in its `hitchy.json` file. Such a declaration is called _static declaration_ of role. On loading component to gather its API this API might include meta information to replace related information read from `hitchy.json` file before. This includes declaration of role. Re-declaring role this way is called _dynamic declaration_ of role.

Roles are used on processing dependencies between hitchy components resulting in a certain order of processing components in every stage of bootstrapping hitchy.

> In fact, all succeeding stages rely on order detected in discovery stage. All but shutdown stage process include components in this same way. Shutdown stage is using reverse order to shut down components.

Any dynamic declaration of a role supersedes its static declaration. In addition it replaces static declaration of same role in any other component discovered before. Eventually any role mustn't be filled by more than one component in a single hitchy-based application. Thus bootstrapping fails if two components _dynamically_ declare to fill the same role. 


#### Overriding

hitchy features _component overloading_ by design. Most of this is prepared in discovery stage.

* By dynamically declaring commonly used role any component might replace default component used otherwise.
* Every component gets information about all other discovered components. Thus either component is enabled to dynamically declare a role depending what other components are available.
* At end of discovery all components with roles replaced by other components get dropped, but prior to that every component with API function `onDiscovered()` is provided with APIs of all components basically discovered before to gather access on API of components it is replacing.


### Configuration

The configuration stage is divided into four steps processed strictly sequentially.

#### Reading custom configuration

First, all modules immediately located in `<projectFolder>/config` are loaded using required. Either module is expected to describe one part of resulting configuration object. Modules either export configuration object or comply with common module pattern to provide it on request.

All results of found modules are compiled into single configuration object using a module's filename without path and extension as property. The resulting configuration is promoted via `api.runtime.config`.

> Configuration `{custom:"bar"}` provided by module `<projectFolder>/config/foo.js` is available via `api.runtime.config.foo.custom` later.

#### Requesting component to configure

All discovered components exposing related API function `configure()` are invoked to process this compiled configuration e.g. by adjusting, validating, normalizing, converting or replacing any contained information.

Exposed function `configure()` must comply with _common module function pattern_. Additional argument in this case is either component's handle providing basic information on component such as its meta data read from its `hitchy.json` file before.

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


### Exposition

In this stage hitchy is gathering and merging elements to build up and expose API of hitchy-based application to be started. Hitchy internally supports four types of such elements: _models_, _controllers_, _policies_ and _services_. Either type may consist of several named elements, but elements must be named uniquely in scope of their type.

> There can't be two models named `foo`, but it is possible to have a model named `foo` and a controller named `foo`, too.

First, hitchy is loading such API elements from every discovered component obeying order detected back then. In scope of a single component models are processed first, controllers are second, policies are third and services are last. In scope of either type per component processing order is unspecified.

> If you have components `foo` and `bar` with `foo` listing `bar` as its dependency then
>
> * all models of `bar` are loaded in unspecified order,
> * all controllers of `bar`are loaded in unspecified order,
> * all policies of `bar` are loaded in unspecified order,
> * all services of `bar` are loaded in unspecified order,
> * all models of `foo` are loaded in unspecified order,
> * all controllers of `foo`are loaded in unspecified order,
> * all policies of `foo` are loaded in unspecified order and
> * all services of `foo` are loaded in unspecified order.

Second, hitchy is handling current application/project relying on hitchy as another component to process just like any other component before.

#### Process per "component"

Hitchy is searching selected sub-folders of component's root (in case of components processed first) or `<projectFolder>` (in case of application processed last).

* Models are read from `api/models` (also supporting `api/model` to be more flexible).
* Controllers are read from `api/controllers` (also supporting `api/controller`).
* Policies are read from `api/policies` (also supporting `api/policy`).
* Services are read from `api/services` (also supporting `api/service`).

For every element there must be a separate file to be named like the element plus the extension `.js`. Every such file is considered to export API element directly or by complying with common module pattern. 

On complying with common module pattern the function exported by module is invoked with additional argument providing element of same name and type gathered and merged so far. This is important for simple extension and overriding of elements exposed by components any current one depends on.

> By default and by intention, hitchy does not adjust case of filenames on deriving names of either element. However, this might be problematic on case-insensitive filesystems. **To support some options to be used then you are strongly advised to keep filenames lowercase.**

All gathered and finally merged elements of application's API are exposed in `api.runtime`, grouped by type of element and using either element's name.

* Models are exposed in `api.runtime.models`.
* Controllers are exposed in `api.runtime.controllers`.
* Policies are exposed in `api.runtime.policies`.
* Services are exposed in `api.runtime.services`.

#### Finalize Elements

In the end there are sets of named elements per type considered to build the application's API. But at last every component is enabled again to check and probably qualify that result as desired. For this a component should provide function `onExposing()` in its API. The method is expected to comply with common module function pattern. The component's handle is passed as additional argument. The function is considered to modify API elements using exposed collections under `api.runtime` listed above.


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
