# Understanding Extensions

Hitchy by itself isn't capable of doing quite much. It strongly relies on extensions. This document provides brief summary on how extensions are integrated into hitchy and describes how to write extensions for hitchy.

## How Is Hitchy Loading Extensions

All extensions get loaded on hitchy's bootstrap. Thus all extensions are loaded prior to handling first request. Any folder in your project's **node_modules** is tested for containing **hitchy.json** file and considered hitchy extension then. This file must be located in root folder of extension and contains the extension's _static meta information_.

Hitchy is loading any extension by "requiring" its folder. Thus you must provide a main script named **index.js** in root folder of your extension or name any other main script in your extension's **package.json** file.

> Every extension must provide main script file to be loaded. This main script may be empty by means of absolutely blank text file.

Here comes a brief profile of _extension loading_:

#### Profile

* **stage:** discovery
  * 2nd stage of bootstrap
  * 1st stage involving any particular extension
* **purpose:** (or _what is it good for in an extension_)
  * detect available extensions
  * choose role to fill eventually
  * provide _dynamic meta information_ (see section on $meta below)
  * _provide API of extension_
* **knowledge:** (or _what info is available to the extension_)
  * hitchy's core API
  * runtime options
  * names of all basically available extensions
  * static meta information (as defined in extension's **hitchy.json** file)
* **processing order:** arbitrary
* **supported types:**
  * object
  * common module pattern

## An Extension's Basic API

Every extension is considered to expose information through several properties usually complying with common module function pattern. 

> Any extension may omit some or even all of the properties listed here. This results in certain default behaviour.

Here comes a list of API properties obeyed by hitchy bootstrap process.

### `$meta`

This property is processed on loading extension. It is merged with meta information read from **hitchy.json** file before.

> $meta is always an object. It can't be function complying with common module function pattern. This doesn't hurt as the API itself may be provided by function on extension complying with common module pattern.

#### Profile

* **stage:** discovery
* **purpose:**
  * adjust meta information depending on current context, e.g.
    * select role to fill
    * select actual dependencies of extension
* **supported types:** 
  * object

#### On Roles

Extensions are required to fill a certain role, which is simply a name given as string. Roles are important for managing dependencies between extensions. By resolving dependencies hitchy is establishing certain order applied to all further processing involving extensions.

There are three kinds of roles:

1. Every extension is assigned implicit role on missing any explicit declaration. This implicit role is equivalent to the extension's name which in turn is just the basename of folder containing it.
2. In **hitchy.json** file role of extension may be declared explicitly as property **role**. 
3. The extension may provide dynamic meta information including property **role** as well.

While the two former are called _static role_ of extension, the latter is called its _dynamic role_. On processing roles of extensions dynamic role takes precedence over static ones, explicitly declared one over implicit one.

##### What if two extensions declare the same role?

_In scope of an application every role may be filled by single extension, only._ 

However, multiple extensions may statically declare to fill the same role as long as one of them is declaring that role dynamically, too. Dynamic role of one extension might clash with static roles of other extensions actually revoking static roles of those. Extensions without any role won't be processed any further. 

Finally two extensions must not claim to fill the same role dynamically.

##### What if role is revoked from extension?

Whenever dynamic role of one extension causes revocation of same role statically declared by another one the latter extension doesn't fill any role anymore unless it declares one dynamically. 

> Due to arbitrary processing of extensions in this stage trying to declare role dynamically after having lost static role may be considered bad practice.

Extensions without role won't be processed after **onDiscovered** (see below). Hitchy won't obey them on configuring or initializing extensions and on preparing routes. It won't be exposed as part of Hitchy's runtime API. However, any replacing extension might use it for extending its functionality.

##### What is good for?

Roles are used to find extensions on resolving dependencies of either extension. Dynamic roles are useful to check current application's scenario first by inspecting list of available extensions. By declaring role dynamically one extension can replace another one transparently e.g. for extending the latter one's functionality.

#### On Dependencies

Extensions may list roles of other extensions they rely on. Hitchy is using this definition of dependencies to apply certain order for processing extensions further on. Any extension gets processed after all its dependencies.

Any application relying on hitchy may choose roles filled by extensions as its initial dependencies. This way hitchy does not load all extensions filling a role but those actually required as immediate as well as mediate dependencies of application.

### `onDiscovered()`

An extension may expose function to be called after having finished discovery of extensions.

#### Profile

* **stage:** discovery
* **purpose:** 
  * save access on replaced extensions e.g. for extending their functionality
* **knowledge:**
  * hitchy's core API
  * runtime options
  * roles filled by extensions eventually
  * references on APIs of all previously discovered extensions (including those having lost their role)
  * collected information on current extension (incl. its folder, name, meta information and API)
* **processing order:** dependency-based
* **supported types:** 
  * common module function pattern

### `configure()`

After discovery of extensions hitchy is reading and merging all configuration files included with application. After this hitchy is notifying all extensions for optional validation and normalization of configuration data.

#### Profile

* **stage:** configuration
* **purpose:** 
  * validate and/or normalize application configuration
* **knowledge:**
  * hitchy's core API plus
    * compiled configuration in `api.runtime.config`
  * runtime options
  * collected information on current extension (incl. its folder, name, meta information and API)
* **processing order:** dependency-based
* **supported types:** 
  * common module function pattern

### `onExposing()`

Next hitchy is collecting and compiling elements of extension API. Those elements are divided into models, controllers, policies and services. Extensions don't have to provide such elements at all. If multiple extensions use same name for some kind of element versions are merged successively.

* An extension's models reside in folder `api/models`.
* An extension's controllers reside in folder `api/controllers`.
* An extension's policies reside in folder `api/policies`.
* An extension's services reside in folder `api/services`.

> On defining any such element hitchy does not qualify models or inject routes to controllers automatically. Instead an application might require extension taking care of that.

After having collected and compiled API elements of all extensions either extension is notified via API function **onExposing()**.

#### Profile

* **stage:** exposure
* **purpose:** 
  * qualify definitions of models, controllers, policies and services (e.g. by extension introducing basic support for models or similar)
* **knowledge:**
  * hitchy's core API plus
	* configuration in `api.runtime.config`
	* compiled elements in `api.runtime.models`, `api.runtime.controllers`, etc.
  * runtime options
  * collected information on current extension (incl. its folder, name, meta information and API)
* **processing order:** dependency-based
* **supported types:** 
  * common module function pattern

### `initialize()`

Every module may provide custom initialization handler e.g. to finally connect to some data source or sync model definitions with schema of data source.

> As a counterpart to this `shutdown()` may be used to release resources requested here.

#### Profile

* **stage:** initialization
* **purpose:** 
  * initialize instance of extension in context of current application runtime (e.g. link to database, etc.)
* **knowledge:**
  * hitchy's full API incl. core, configuration and elements
  * runtime options
  * collected information on current extension (incl. its folder, name, meta information and API)
* **processing order:** dependency-based
* **supported types:** 
  * common module function pattern

### `routes` and `policies`

After initializing extension and gaining access on backends to be available through some extension it is time to declare routes mapping incoming requests onto controllers for generating proper responses.

Every extension may provide one or two separate maps for matching incoming requests and select method in controller or policy to process the request. First map is for policy routing and is given in API property `policies`. The second one is regarding responder routing and is given in API property `routes`.

> Either map may be given literally (thus being defined on loading extension) or as a function complying with common module function pattern to generate map now. The latter case enables definition of routes depending on application's actual context.

#### Profile

* **stage:** router configuration
* **purpose:** 
  * (compile and) provide map of request URL patterns into selection of methods to invoke for filtering requests (_policies_) or for responding (_responders_)
* **knowledge:**
  * hitchy's full API incl. core, configuration and elements
  * runtime options
  * collected information on current extension (incl. its folder, name, meta information and API)
* **processing order:** dependency-based
* **supported types:** 
  * object
  * common module function pattern
    
#### Important note on routing

Request dispatching doesn't obey order of routes given by single extension. Thus any extension shouldn't rely on routes being processed the same way they are listed in source code, but carefully choose request URL patterns for uniquely matching. On one hand that's due to improving organization of routes for fast processing. That's way routing maps are organized as objects in javascript. On the other hand properties of objects can't be enumerated in a reliable order. That's due to specification for implementations of javascript engine.

Routes of different extensions are processed in dependency-based order of extensions.

### `shutdown()`

This method is expected to implement counterpart to `initialize()` described before.

On properly shutting down hitchy application it first closes all open client connections. After that it shuts down application by notifying all extensions in reverse dependency-based order using this optionally provided API method. Due to reversing order of extension processing any extension that was initialized last on bootstrap gets shut down first now.

#### Profile

* **stage:** application shutdown
* **purpose:** 
  * release resources requested on initializing extension
* **knowledge:**
  * hitchy's full API incl. core, configuration and elements
  * runtime options
  * collected information on current extension (incl. its folder, name, meta information and API)
* **processing order:** reverse dependency-based
* **supported types:** 
  * common module function pattern
