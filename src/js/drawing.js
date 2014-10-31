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
 * Update URL's hash with render parameters so we can pass it around.
 */
function updateHashTag(iterations)
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
	var tags = location.hash.slice(1).split('&');

	for ( var i=0; i<tags.length; ++i ) {
		var tag = tags[i].split('=');
		var key = tag[0];
		var val = tag[1];

		switch ( key ) {
			case 'zoom': {
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
		canvas.width  = window.innerWidth;
		canvas.height = window.innerHeight;

		ccanvas = $('canvasControls');
		ccanvas.width  = window.innerWidth;
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
	
	updateHashTag(steps);
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
