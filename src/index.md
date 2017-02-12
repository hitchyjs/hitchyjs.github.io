## About

hitchy is yet another web application framework. 

## How To Get It` 

* [Clone on GitHub](https://github.com/hitchyjs/core)
* [Install with npm](https://www.npmjs.com/package/hitchy)

## Motivation

After trying several web application frameworks our team eventually has ended up 
with using sailsjs before to develop new software for the web. Sails includes 
data storage API, knows how to define and manage data models, using controllers 
etc. All that stuff is instantly available in a freshly created sailsjs 
application project. But then we started to check the code of sailsjs and 
felt - let's say - grounded.

Parts of code in sailsjs obviously has been written by someone who didn't know
Javascript very well. We've found constructors returning `this` or binding 
prototype methods to `this` for no obvious reason. And since we will be held
responsible for code we develop for our customers we always had some headaches 
when thinking about those flaws in code. We even tried to do revisions and 
provide them upstream. The related pull request has been pending w/o a response 
for months now, though. In addition we consider sailsjs' paradigm to promote 
several APIs globally bad practice. Because of all this sailsjs is currently 
dropping off the table.

After that we evaluated different options for replacing sailsjs. 
1. trailsjs does not look mature enough to start coding custom applications. 
   (Yes, at this time hitchy isn't even nearly as mature as trailsjs.) In 
   addition it suffers from trying to be too flexible reducing its integrated 
   set of features to a least common denominator when it comes to support 
   selecting one of several possible backend systems e.g. for accessing data 
   storages via ORM: discussions on issue tracking revealed some limitations by 
   design when it comes to using benefits provided by one probable backend but 
   missing in another one (e.g. waterline-orm vs. knex).
2. At first glance StrongLoop was a very promising framework, but finally we 
   dropped it either for being much too bloated for projects requiring lean and 
   fast server logic.
3. mean was off the table prior to falling in love with sailsjs for focusing on 
   NoSQL backends whereas we need to cover SQL databases as well. Probably one 
   can integrate SQL backends with mean, too. But any software might be extended
   one way or the other and so this won't affect our refusal of mean as option.

Any recently tested framework felt like a Lego system due to sticking with a
common pattern of linking tons of packages and modules together not caring for
how well or badly either package is implemented. Well, that's pretty usual in 
npm eco system. And even though we basically feel committed to the opportunities 
provided by npm this dependency hell always tends to become PITA after some time
when dependencies start upgrading to new majors while others don't. Using lots 
of modules also has an increasing impact on performance and we actually like 
performance, too.

Eventually we started creating our own software for there is no completely 
satisfying solution in the field. So, here comes our own framework to pick all 
the goodies provided by previous frameworks we've been working with and to 
integrate some additional benefits.

## So, what is it?

hitchy is designed to basically do the backend job in web applications, that is
storing data on servers, probably helping with kickstarting client applications
working with AngularJS or similar. It's intended to stay open for extensions.

The name _hitchy_ was chosen to express the intention to have a framework that
might be injected into existing applications. Quite a lot of them use expressjs 
or provide opportunity to inject middleware compatible with it. So, hitchy is 
working as an expressjs middleware, too.

However, hitchy is capable of running just with node's integrated HTTP server, 
too. That's the way it is developed most of the time currently: using very 
simple testing environments that don't require expressjs application setup.

As mentioned we also worry about performance and starting up a sailsjs project
quickly becomes a lasting process. Code in hitchy isn't always quite as clean as
desired but that's mostly due to improving performance by preventing use of
callbacks as much as possible. Small stack sizes improve performance quite much 
(and using modules using modules for using modules is having quite the opposite 
effect). 

hitchy relies on more recent releases of nodejs and it's using native Promise 
API to support on-demand asynchronous processing most of the time. We loved to 
work with bluebirdjs and all its helpers, but sticking with the basics to keep 
hitchy free of dependencies is impressive as well.

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

Add folder `config` and put a file `routes.js` in there:

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

> hitchy CLI-based server script is catching Ctrl+C for properly shutting down
server. This includes watching all active connections and turning off 
_keep-alive_ while reducing timeout to prevent server from taking tons of time 
to shutdown.

## More goodies to mention

* All extensions and components distributed with core are using an equivalent
approach for deciding order of loading, configuring and initializing either
component. Any module might ask for dependencies. This way any bootstrap stage
supported by a component is invoked after related stage of its dependencies have
passed before. By using Promises either component may delay its processing in
any stage if required.
* On shutting down an equivalent stage is triggered enabling any component to 
properly shutdown. Components are processed in reverse order then compared to 
startup phase.
* By intention it's footprint on dependencies is quite low, currently. Actually
we consider to keep the core nearly as simple as now and provide several
extensions e.g. for enabling hitchy 
  * to support models with blueprint actions like in sails to store data in a 
    storage or 
  * to support development of angular-based client.

