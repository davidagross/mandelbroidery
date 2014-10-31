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
 
 function focusOnSubmit()
{
	var e = $('submitButton');
	if ( e ) e.focus();
}

function main()
{
	$('steps').onchange = function(event)
	{
		// disable auto-iterations when user edits it manually
		$('autoIterations').checked = false;
		draw(getColorPicker());
	}
	
	$('autoIterations').onchange = function(event) { if ($('autoIterations').checked) { draw(getColorPicker()); } }
	
	$('escapeRadius').onchange = function(event) { draw(getColorPicker()); }
	
	$('colorScheme').onchange = function(event) { draw(getColorPicker()); }
	
	$('colorSmoothing').onchange = function(event) { draw(getColorPicker()); }
	
	$('patternWidth').onchange = function(event) { draw(getColorPicker()); }
	
	$('patternHeight').onchange = function(event) { draw(getColorPicker()); }
	
	$('resetButton').onclick = function(event)
	{
		$('settingsForm').reset();
		setTimeout(function() { location.hash = ''; }, 1);
		zoom = [zoomStart, zoomStart];
		lookAt = lookAtDefault;
		reInitCanvas = true;
		draw(getColorPicker());
	};

	$('viewPNG').onclick = function(event)
	{
		window.location = canvas.toDataURL('image/png');
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

		var reCenter = function(event) {
			
			var x = event.clientX;
			var y = event.clientY;

			var w = window.innerWidth;
			var h = window.innerHeight;

			var dx = (xRange[1] - xRange[0]) / (0.5 + (canvas.width-1));
			var dy = (yRange[1] - yRange[0]) / (0.5 + (canvas.height-1));

			x = xRange[0] + x*dx;
			y = yRange[0] + y*dy;

			lookAt = [x, y];
		
		}
		
		var zoomOut = function(event) {
			
			reCenter(event);

			zoom[0] /= 0.5;
			zoom[1] /= 0.5;

		};
		
		$('canvasControls').onmouseup = function(e)
		{
			if ( box != null ) {
				
				// single right or left click
				if (box[0] == box[2] && box[1] == box[3]) {
					box = null;
					if (e.shiftKey)
						zoomOut(e);
					else
						reCenter(e);
					 draw(getColorPicker()); 
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
}

main();