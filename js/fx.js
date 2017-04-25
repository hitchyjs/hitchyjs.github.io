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

var domBody = document.getElementsByTagName( "body" )[0];
var bodyClasses = domBody.classList;



/*
 * add mark on body regarding number and constellation of columns actually used
 * on current page
 */
var columns = [], ref;

( ref = document.getElementById( "left" ) ) && ref.firstElementChild && columns.push( "left" );
( ref = document.getElementById( "right" ) ) && ref.firstElementChild && columns.push( "right" );

bodyClasses.add( "columns-" + ( 1 + columns.length ) );
columns.forEach( function( name ) {
	bodyClasses.add( "with-" + name );
} );



/*
 * add mark on body regarding current browser
 */
var ua = navigator.userAgent,
	match;

if ( match = /Firefox\/(\d+)/i.exec( ua ) ) {
	bodyClasses.add( "gecko", "v" + match[1] );
} else if ( match = /MSIE\s+(\d+)/i.exec( ua ) ) {
	bodyClasses.add( "trident", "v" + match[1] );
} else if ( match = /WebKit/i.exec( ua ) ) {
	bodyClasses.add( "webkit" );
}

bodyClasses.add( navigator.platform.toLowerCase() );
