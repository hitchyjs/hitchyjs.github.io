/**
 * (c) 2017 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

const Transform = require( "stream" ).Transform;
const Path = require( "path" );
const File = require( "fs" );

const gulp = require( "gulp" );


gulp.task( "pages", function() {
	gulp.pages = [ {
		path: "index.html",
		label: "home"
	} ];

	return gulp.src( "src/**/*.md", { base: "src" } )
		.pipe( new Transform( {
			objectMode: true,
			transform( file, dummy, done ) {
				file.contents = Buffer.from( file.contents.toString().replace( /(\[[^\]]+\]\([^\)]+)\.md\)/g, "$1.html)" ) );

				done( null, file );
			}
		} ) )
		.pipe( require( "gulp-markdown" )( {
			gfm: true,
			tables: true
		} ) )
		.pipe( require( "gulp-wrap" )( {
			src: "templates/.page.html"
		} ) )
		.pipe( new Transform( {
			objectMode: true,
			transform( file, dummy, done ) {
				if ( [ "index.html", "license.html" ].indexOf( file.relative ) < 0 ) {
					gulp.pages.push( {
						path: file.relative,
						label: file.relative.replace( /\.html$/, "" ).replace( /\//, " - " )
					} );
				}

				done( null, file );
			}
		} ) )
		.pipe( gulp.dest( "pages" ) );
} );

gulp.task( "menu", ["pages"], function() {
	return gulp.src( "pages/**/*.html", { base: "pages" } )
		.pipe( new Transform( {
			objectMode: true,
			transform( file, dummy, done ) {
				let menu = gulp.pages.map( function( link ) {
					let relative = Path.relative( Path.dirname( file.path ), Path.resolve( file.base, link.path ) );

					return `<a href="${relative}">${link.label}</a>`;
				} );

				file.contents = Buffer.from( file.contents.toString().replace( /<!--\s*MENU\s*-->/g, menu.join( " " ) ) );

				done( null, file );
			}
		} ) )
		.pipe( gulp.dest( "pages" ) );
} );

gulp.task( "default", [ "pages", "menu" ] );


gulp.watch( ["src/**/*.md", "templatea/*.html"], [ "default" ] );
