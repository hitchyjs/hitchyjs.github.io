* [Get it from GitHub](https://github.com/hitchyjs/core)
* [Install with npm](https://www.npmjs.com/package/hitchy)

## Motivation

hitchy is yet another web application framework. After trying all kinds of web
application frameworks our team eventually ended up with using sailsjs to
develop new software for the web. Sails includes data storage API, knows how to
define and manage data models, using controllers etc. All that stuff is instantly
available in a freshly created sailsjs application project.

But then we started to check the code of sailsjs and felt - let's say - grounded.

Parts of code in sailsjs obviously has been written by someone who doesn't know
Javascript very well. And since we will be responsible for code we develop for
our customers we always had some headaches when thinking about those flaws in
code. We even tried to do revisions and provide them upstream, but one of our
first pull requests is still pending. In addition we consider sailsjs' paradigm
to promote several APIs globally bad practice. Because of all this sailsjs is
currently dropping off the table.

After that we evaluated different options for replacing sailsjs. trailsjs does
not look mature enough to start coding custom applications. In addition it
suffers from trying to be too flexible reducing its integrated set of features
to a least common denominator when it comes to supported backend systems competing
with each other. On behalf of database backend discussions on issue tracking
revealed some limitations by design when it comes to using benefits provided by
waterline-orm due to using API suitable to interact with knex or other backends
as well. That's bad, sorry.

At first glance StrongLoop was a very promising framework, but finally we dropped
it either for being much too bloated for projects requiring lean and fast server
logic.

Any recently tested framework felt like a Lego system due to sticking with a
common pattern of linking tons of packages and modules together not caring for
how good or bad either package is implemented. Even though we basically feel
committed to the opportunities provided by npm this dependency hell always tends
to become PITA after some while when some dependencies start upgrading to new
majors while others don't. Using lots of modules also has an increasing impact
on performance and we actually for performance.

Last but not least we somewhat always tend to start creating our own software in
the end when there is no totally satisfying solution in field, eventually. So,
as of early 2017 we ended up with starting our own framework to pick all the
goodies provided by previous frameworks we've been working with and integrating
some more benefits.

## So, what is it?

hitchy is designed to basically do the backend job in web applications, that is
storing data on servers, probably helping with kickstarting client applications
working with AngularJS or similar. It's intended to stay open for extensions,
but without those headaches that come with sailsjs when it comes to revising
models and overloading controllers provided by some used extension.

Event though hitchy is capable of running just with node's integrated HTTP
server, it is basically designed to work as expressjs compatible middleware as
well. That's why we decided to call it `hitchy` ... by using injectors projects
might be injected into other nodejs web application frameworks as well.

As mentioned we also worry about performance and starting up a sailsjs project
quickly becomes a lasting process. Code in hitchy isn't always quite as clean as
desired but that's mostly due to improving performance by preventing use of
callbacks as much as possible. hitchy also relies on more recent releases of
nodejs and its using native Promises to support on-demand asynchronour
processing most of the time.

## And how does it work?

Here comes a quickstart for current releases of hitchy.

> _Since we've started to develop just days ago you definitely may consider this
framework to be in alpha stage currently._ This means that any tutorial given
here might be broken in future releases.

Open your favourite CLI and start with these commands:

```
mkdir myproject
cd myproject
npm init
npm install --save hitchy
hitchy start
```

This will generate an empty project folder with hitchy as dependency. The last
command is firing up hitchy's internal server relying on node's HTTP server,
only.

As of v0.0.5 hitchy has been tested to properly route requests to controllers
and optionally include policies. However, since this project is empty, any
request results in a 404 error.

Create folder `api/controllers` and put a file `view.js` in there:

```javascript
module.exports = {
	read: function( req, res ) {
		res.send( req.indexed );
	},
	readWithId: function( req, res ) {
		res.send( req.params );
	},
	bodyPosted: function( req, res ) {
		res.send( req.body );
	},
	bodyNormal: function( req, res ) {
		res.send( "normal request" );
	},
	create: function( req, res ) {
		res.send( req.promised );
	}
};
```

Next add folder `api/policies` and put a file `filter.js` in there:

```javascript
module.exports = {
	index: function( req, res, next ) {
		req.indexed = "yeah!";
		next();
	},
	promised: function( req, res ) {
		req.promised = "yup!";
		return new Promise( function( resolve ) { setTimeout( resolve, 1000 ); } );
	},
};
```

finally add folder `config` and put a file `routes.js` in there:

```javascript
module.exports = {
	"/view/read": "ViewController.read",
	"/view/read/:id": "ViewController.readWithId",
	"/view/body": "ViewController.bodyNormal",
	"POST /view/body": "ViewController.bodyPosted",
	"/view/create": "ViewController.create",
	"/view/create/:name": "ViewController.create",
	"/view/create(/:id)?": "ViewController.create",
};
```

Put another file `policies.js` into the same folder:

```javascript
module.exports = {
	"/view/read": "FilterPolicy",
	"/view/create": "FilterPolicy.promised",
};
```

Finally restart hitchy server and try requesting `http://127.0.0.1:3000/view/read`
or similar.

> hitchy CLI-based server script includes proper support for catching Ctrl+C
for properly shutting server down. This includes watching all active connections
and turning off _keep-alive_ while reducing timeout to prevent server from
taking tons of time to shutdown.

## More goodies to mention

* All extensions and components distributed with core are using an equivalent
approach for deciding order of loading, configuring and initializing either
component. Any module might ask for dependencies. This way any bootstrap stage
supported by a component is invoked after related stage of its dependencies have
passed before. By using Promises either component may delay its processing in
any stage if required.
* On shutting down hitchy all components are enabled to properly shutdown using
reverse order compared to startup phase.
* By intention it's footprint on dependencies is quite low, currently. Actually
we consider to keep the core nearly as simple as now and provide several
extension e.g. for enabling hitchy to support development of angular-based
client.

