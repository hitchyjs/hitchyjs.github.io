## Concepts

### Common Module Pattern

In several situations hitchy supports particular pattern for providing additional data and/or functionality. This pattern is available for injecting components into your hitchy setup, for providing custom configuration in your project's configuration related to hitchy and in all models, controllers, policies and services of your project and its extending components.

In either case any such _module_ might provide requested data as such. However, the more beneficial way is to export a single function that is expected to return that requested data. You are advised to stick with the latter technique to gain full access on API and options used to start/inject hitchy. By exporting function component you might even return promise to provide requested data with delay. For example, discovery process or compilation of project's configuration is delayed until some returned promise is resolved with eventually provided information.

A short example of hitchy's common module pattern looks like this:

```javascript
/**
 * Provides implementation for second stage of bootstrapping hitchy instance.
 *
 * @this HitchyAPI
 * @param {HitchyOptions} options
 * @returns {function(modules:HitchyComponentHandle[]):Promise.<HitchyComponentHandle[]>}
 */
module.exports = function( options ) {
	let api = this;
	
	return {
		// here comes your actual data 
		configure: function() {
			
		}
	};
};
```

By following this pattern access on hitchy's API is provided through closure variable `api` here. This includes all found configuration, any model or controller etc. Thus, when documentation refers to some variable or data available as `api.foo.bar` this is referring to the access granted here. In addition `options` is available to access configuration provided by application or runtime environment injecting hitchy. E.g. on using hitchy's internal server this includes any custom command line option.

### Meta Data File

Every component needs to provide a file `hitchy.json` in its root folder. This file is used by hitchy to detect this component and expect it to be compatible with its bootstrap process. Contained data is qualified on loading (e.g. to include some default values). It is available via special property `$meta` of components API which in turn is promoted via `api.components`.

> **Example:** Component hitchy-foo has meta data file containing this:
> ```JSON
> { 
>   "role": "foo", 
>   "custom": "info" 
> }
> ```
> At runtime any code is capable of accessing this information using `api.components.foo.$meta.custom` or similar.

Basically the file might be empty by means of containing empty JSON-encoded object.
 
```JSON
{}
```

Of course the file actually contains some information in most cases. Here is a brief list of supported properties:

#### role

This string property explicitly declares the role filled by component. By default this is derived from basename of folder containing component (and thus this `hitchy.json` file). By explicitly providing role here component might declare to fill certain role different from component's name. This is useful to promote the component for replacing another one.


#### dependencies

This optional list of strings lists all roles of hitchy components this current component depends on. This list is used to ensure all required components are available. In addition it affects the order of bootstrapping components.
