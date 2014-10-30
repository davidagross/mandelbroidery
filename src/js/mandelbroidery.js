/*
 * Mandelbroidery, in HTML5 canvas and javascript.
 * https://github.com/davidagross/mandelbroidery
 *
 * Copyright (C) 2014 David Alexander Gross
 *
 * Based on:
 *
 * https://github.com/cslarsen/mandelbrot-js
 *
 * Copyright (C) 2012 Christian Stigen Larsen
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.	You may obtain
 * a copy of the License at
 *
 *		 http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.	See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 */

/*
 * Global variables:
 */
var zoomStart = 3.4;
var zoom = [zoomStart, zoomStart];
var lookAtDefault = [-0.6, 0];
var lookAt = lookAtDefault;
var xRange = [0, 0];
var yRange = [0, 0];
var escapeRadius = 10.0;
var interiorColor = [0, 0, 0, 255];
var reInitCanvas = true; // Whether to reload canvas size, etc
var dragToZoom = true;
var colors = [[0,0,0,0]];
var renderId = 0; // To zoom before current render is finished

/*
 * Initialize canvas
 */
var canvas = $('canvasMandelbrot');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
//
var ccanvas = $('canvasControls');
ccanvas.width	= window.innerWidth;
ccanvas.height	= window.innerHeight;
//
var ctx = canvas.getContext('2d');
var img = ctx.createImageData(canvas.width, 1);

/*
 * Just a shorthand function: Fetch given element, jQuery-style
 */
function $(id)
{
	return document.getElementById(id);
}

function focusOnSubmit()
{
	var e = $('submitButton');
	if ( e ) e.focus();
}

function getColorPicker()
{
	var p = $("colorScheme").value;
	if ( p == "pickColorHSV1" ) return pickColorHSV1;
	if ( p == "pickColorHSV2" ) return pickColorHSV2;
	if ( p == "pickColorHSV3" ) return pickColorHSV3;
	if ( p == "pickColorGrayscale2" ) return pickColorGrayscale2;
	return pickColorGrayscale;
}

/*
 * Update URL's hash with render parameters so we can pass it around.
 */
function updateHashTag(samples, iterations)
{
	var radius = $('escapeRadius').value;
	var scheme = $('colorScheme').value;

	location.hash = 'zoom=' + zoom + '&' +
					'lookAt=' + lookAt + '&' +
					'iterations=' + iterations + '&' +
					'escapeRadius=' + radius + '&' +
					'colorScheme=' + scheme;
}

/*
 * Update small info box in lower right hand side
 */
function updateInfoBox()
{
	// Update infobox
	$('infoBox').innerHTML =
		'x<sub>0</sub>=' + xRange[0] + ' y<sub>0</sub>=' + yRange[0] + ' ' +
		'x<sub>1</sub>=' + xRange[1] + ' y<sub>1</sub>=' + yRange[1] + ' ' +
		'w&#10799;h=' + canvas.width + 'x' + canvas.height + ' '
				+ (canvas.width*canvas.height/1000000.0).toFixed(1) + 'MP';
}

/*
 * Parse URL hash tag, returns whether we should redraw.
 */
function readHashTag()
{
	var redraw = false;
	var tags = location.hash.split('&');

	for ( var i=0; i<tags.length; ++i ) {
		var tag = tags[i].split('=');
		var key = tag[0];
		var val = tag[1];

		switch ( key ) {
			case '#zoom': {
				var z = val.split(',');
				zoom = [parseFloat(z[0]), parseFloat(z[1])];
				redraw = true;
			} break;

			case 'lookAt': {
				var l = val.split(',');
				lookAt = [parseFloat(l[0]), parseFloat(l[1])];
				redraw = true;
			} break;

			case 'iterations': {
				$('steps').value = String(parseInt(val, 10));
				$('autoIterations').checked = false;
				redraw = true;
			} break;

			case 'escapeRadius': {
				escapeRadius = parseFloat(val);
				$('escapeRadius').value = String(escapeRadius);
				redraw = true;
			} break;

			case 'colorScheme': {
				$('colorScheme').value = String(val);
				redraw = true;
			} break;
		}
	}

	if ( redraw )
		reInitCanvas = true;

	return redraw;
}

/*
 * Return number with metric units
 */
function metric_units(number)
{
	var unit = ["", "k", "M", "G", "T", "P", "E"];
	var mag = Math.ceil((1+Math.log(number)/Math.log(10))/3);
	return "" + (number/Math.pow(10, 3*(mag-1))).toFixed(2) + unit[mag];
}

/*
 * Convert hue-saturation-value/luminosity to RGB.
 *
 * Input ranges:
 *	 H =	 [0, 360] (integer degrees)
 *	 S = [0.0, 1.0] (float)
 *	 V = [0.0, 1.0] (float)
 */
function hsv_to_rgb(h, s, v)
{
	if ( v > 1.0 ) v = 1.0;
	var hp = h/60.0;
	var c = v * s;
	var x = c*(1 - Math.abs((hp % 2) - 1));
	var rgb = [0,0,0];

	if ( 0<=hp && hp<1 ) rgb = [c, x, 0];
	if ( 1<=hp && hp<2 ) rgb = [x, c, 0];
	if ( 2<=hp && hp<3 ) rgb = [0, c, x];
	if ( 3<=hp && hp<4 ) rgb = [0, x, c];
	if ( 4<=hp && hp<5 ) rgb = [x, 0, c];
	if ( 5<=hp && hp<6 ) rgb = [c, 0, x];

	var m = v - c;
	rgb[0] += m;
	rgb[1] += m;
	rgb[2] += m;

	rgb[0] *= 255;
	rgb[1] *= 255;
	rgb[2] *= 255;
	return rgb;
}

/*
 * Adjust aspect ratio based on plot ranges and canvas dimensions.
 */
function adjustAspectRatio(xRange, yRange, canvas)
{
	var ratio = Math.abs(xRange[1]-xRange[0]) / Math.abs(yRange[1]-yRange[0]);
	var sratio = canvas.width/canvas.height;
	if ( sratio>ratio ) {
		var xf = sratio/ratio;
		xRange[0] *= xf;
		xRange[1] *= xf;
		  zoom[0] *= xf;
	} else {
		var yf = ratio/sratio;
		yRange[0] *= yf;
		yRange[1] *= yf;
		  zoom[1] *= yf;
	}
}

/*
 * Render the Mandelbrot set
 */
function draw(pickColor)
{
	if ( lookAt === null ) lookAt = [-0.6, 0];
	if ( zoom === null ) zoom = [zoomStart, zoomStart];

	xRange = [lookAt[0]-zoom[0]/2, lookAt[0]+zoom[0]/2];
	yRange = [lookAt[1]-zoom[1]/2, lookAt[1]+zoom[1]/2];

	if ( reInitCanvas ) {
		reInitCanvas = false;

		canvas = $('canvasMandelbrot');
		canvas.width	= window.innerWidth;
		canvas.height = window.innerHeight;

		ccanvas = $('canvasControls');
		ccanvas.width	= window.innerWidth;
		ccanvas.height = window.innerHeight;

		ctx = canvas.getContext('2d');
		img = ctx.createImageData(canvas.width, 1);

		adjustAspectRatio(xRange, yRange, canvas);
	}

	var steps = parseInt($('steps').value, 10);

	if ( $('autoIterations').checked ) {
		var f = Math.sqrt(
						0.001+2.0 * Math.min(
							Math.abs(xRange[0]-xRange[1]),
							Math.abs(yRange[0]-yRange[1])));

		steps = Math.floor(223.0/f);
		$('steps').value = String(steps);
	}

	var escapeRadius = Math.pow(parseFloat($('escapeRadius').value), 2.0);
	
	var pw = $('patternWidth').value;
	var ph = $('patternHeight').value;

	var grid = new MandelGrid(pw,ph,xRange,yRange,escapeRadius,steps);
	
	var dwpx = Math.round(canvas.width / grid.width);
	var dhpx = Math.round(canvas.height / grid.height);
	
	updateHashTag(1, steps);
	updateInfoBox();

	// Only enable one render at a time
	renderId += 1;

	function drawLine(y,sy)
	{
		var x = 0;
		var off = 0;
		
		for ( var sx=0; sx<canvas.width; ++sx ) {
	
		if ( sx / dwpx % 1 == 0 && x < grid.width - 1 && sx != 0) { x += 1; }
	
			var p = grid.cells[y][x];
			var color = pickColor(steps, p[0], p[1], p[2]);
			img.data[off++] = color[0];
			img.data[off++] = color[1];
			img.data[off++] = color[2];
			img.data[off++] = 255;
		}
	}

	function render()
	{
		var startHeight = canvas.height;
		var startWidth = canvas.width;
		var y = 0;
		var sy = 0;
		var ourRenderId = renderId;

		var scanline = function()
		{
			if (renderId != ourRenderId ||
				startHeight != canvas.height ||
				startWidth != canvas.width )
			{
				// Stop drawing
				return;
			}

			drawLine(y,sy);
			if ( sy / dhpx % 1 == 0 && y < grid.height-1 && sy != 0 ) { y += 1; }
			ctx.putImageData(img, 0, sy);

			/*
			 * JavaScript is inherently single-threaded, and the way
			 * you yield thread control back to the browser is MYSTERIOUS.
			 *
			 * People seem to use setTimeout() to yield, which lets us
			 * make sure the canvas is updated, so that we can do animations.
			 *
			 * But if we do that for every scanline, it will take 100x longer
			 * to render everything, because of overhead.	So therefore, we'll
			 * do something in between.
			 */
			if ( sy++ < canvas.height ) { scanline(); }
		};

		// Disallow redrawing while rendering
		scanline();
	}

	render();
}

// Some constants used with smoothColor
var logBase = 1.0 / Math.log(2.0);
var logHalfBase = Math.log(0.5)*logBase;

function smoothColor(steps, n, Tr, Ti)
{
	/*
	 * Original smoothing equation is
	 *
	 * var v = 1 + n - Math.log(Math.log(Math.sqrt(Zr*Zr+Zi*Zi)))/Math.log(2.0);
	 *
	 * but can be simplified using some elementary logarithm rules to
	 */
	 
	return 5 + n - logHalfBase - Math.log(Math.log(Tr+Ti))*logBase;
}

function pickColorHSV1(steps, n, Tr, Ti)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	var c = hsv_to_rgb(360.0*v/steps, 1.0, 1.0);
	c.push(255); // alpha
	return c;
}

function pickColorHSV2(steps, n, Tr, Ti)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	var c = hsv_to_rgb(360.0*v/steps, 1.0, 10.0*v/steps);
	c.push(255); // alpha
	return c;
}

function pickColorHSV3(steps, n, Tr, Ti)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	var c = hsv_to_rgb(360.0*v/steps, 1.0, 10.0*v/steps);

	// swap red and blue
	var t = c[0];
	c[0] = c[2];
	c[2] = t;

	c.push(255); // alpha
	return c;
}

function pickColorGrayscale(steps, n, Tr, Ti)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	v = Math.floor(512.0*v/steps);
	if ( v > 255 ) v = 255;
	return [v, v, v, 255];
}

function pickColorGrayscale2(steps, n, Tr, Ti)
{
	if ( n == steps ) { // converged?
		var c = 255 - Math.floor(255.0*Math.sqrt(Tr+Ti)) % 255;
		if ( c < 0 ) c = 0;
		if ( c > 255 ) c = 255;
		return [c, c, c, 255];
	}

	return pickColorGrayscale(steps, n, Tr, Ti);
}

function main()
{
	$('viewPNG').onclick = function(event)
	{
		window.location = canvas.toDataURL('image/png');
	};

	$('steps').onkeypress = function(event)
	{
		// disable auto-iterations when user edits it manually
		$('autoIterations').checked = false;
	}

	$('resetButton').onclick = function(even)
	{
		$('settingsForm').reset();
		setTimeout(function() { location.hash = ''; }, 1);
		zoom = [zoomStart, zoomStart];
		lookAt = lookAtDefault;
		reInitCanvas = true;
		draw(getColorPicker());
	};

	if ( dragToZoom == true ) {
		var box = null;

		$('canvasControls').onmousedown = function(e)
		{
			if ( box == null )
				box = [e.clientX, e.clientY, 0, 0];
		}

		$('canvasControls').onmousemove = function(e)
		{
			if ( box != null ) {
				var c = ccanvas.getContext('2d');
				c.lineWidth = 1;

				// clear out old box first
				c.clearRect(0, 0, ccanvas.width, ccanvas.height);

				// draw new box
				c.strokeStyle = '#FF3B03';
				box[2] = e.clientX;
				box[3] = e.clientY;
				c.strokeRect(box[0], box[1], box[2]-box[0], box[3]-box[1]);
			}
		}

		var zoomOut = function(event) {
			var x = event.clientX;
			var y = event.clientY;

			var w = window.innerWidth;
			var h = window.innerHeight;

			var dx = (xRange[1] - xRange[0]) / (0.5 + (canvas.width-1));
			var dy = (yRange[1] - yRange[0]) / (0.5 + (canvas.height-1));

			x = xRange[0] + x*dx;
			y = yRange[0] + y*dy;

			lookAt = [x, y];

			if ( event.shiftKey ) {
				zoom[0] /= 0.5;
				zoom[1] /= 0.5;
			}

			draw(getColorPicker());
		};

		$('canvasControls').onmouseup = function(e)
		{
			if ( box != null ) {
				// Zoom out?
				if ( e.shiftKey ) {
					box = null;
					zoomOut(e);
					return;
				}

				/*
				 * Clear entire canvas
				 */
				var c = ccanvas.getContext('2d');
				c.clearRect(0, 0, ccanvas.width, ccanvas.height);

				/*
				 * Calculate new rectangle to render
				 */
				var x = Math.min(box[0], box[2]) + Math.abs(box[0] - box[2]) / 2.0;
				var y = Math.min(box[1], box[3]) + Math.abs(box[1] - box[3]) / 2.0;

				var dx = (xRange[1] - xRange[0]) / (0.5 + (canvas.width-1));
				var dy = (yRange[1] - yRange[0]) / (0.5 + (canvas.height-1));

				x = xRange[0] + x*dx;
				y = yRange[0] + y*dy;

				lookAt = [x, y];

				/*
				 * This whole code is such a mess ...
				 */

				var xf = Math.abs(Math.abs(box[0]-box[2])/canvas.width);
				var yf = Math.abs(Math.abs(box[1]-box[3])/canvas.height);

				zoom[0] *= Math.max(xf, yf); // retain aspect ratio
				zoom[1] *= Math.max(xf, yf);

				box = null;
				draw(getColorPicker());
			}
		}
	}

	/*
	 * Enable zooming (currently, the zooming is inexact!) Click to zoom;
	 * perfect to mobile phones, etc.
	 */
	if ( dragToZoom == false ) {
		$('canvasMandelbrot').onclick = function(event)
		{
			var x = event.clientX;
			var y = event.clientY;
			var w = window.innerWidth;
			var h = window.innerHeight;

			var dx = (xRange[1] - xRange[0]) / (0.5 + (canvas.width-1));
			var dy = (yRange[1] - yRange[0]) / (0.5 + (canvas.height-1));

			x = xRange[0] + x*dx;
			y = yRange[0] + y*dy;

			lookAt = [x, y];

			if ( event.shiftKey ) {
				zoom[0] /= 0.5;
				zoom[1] /= 0.5;
			} else {
				zoom[0] *= 0.5;
				zoom[1] *= 0.5;
			}

			draw(getColorPicker());
		};
	}

	/*
	 * When resizing the window, be sure to update all the canvas stuff.
	 */
	window.onresize = function(event)
	{
		reInitCanvas = true;
	};

	/*
	 * Read hash tag and render away at page load.
	 */
	readHashTag();

	/*
	 * This is the weirdest bug ever.	When I go directly to a link like
	 *
	 *	 mandelbrot.html#zoom=0.01570294345468629,0.010827482681521361&
	 *	 lookAt=-0.3083866260309053,-0.6223590662533901&iterations=5000&
	 *	 &escapeRadius=16&colorScheme=pickColorHSV2
	 *
	 * it will render a black image, but if I call the function twice, it
	 * works nicely.	Must be a global variable that's not been set upon the
	 * first entry to the function (TODO: Find out what's wrong).
	 *
	 * Yeah, I know, the code is a total mess at the moment.	I'll get back
	 * to that.
	 */
	draw(getColorPicker());
	draw(getColorPicker());
}

main();
