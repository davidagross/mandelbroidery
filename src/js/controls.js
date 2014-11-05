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
 
$('steps').onchange = function(event)
{
	// disable auto-iterations when user edits it manually
	$('autoIterations').checked = false;
	state.valid = false;
}

$('autoIterations').onchange = function(event) { if ($('autoIterations').checked) { state.valid = false; } }

$('escapeRadius').onchange = function(event) { state.valid = false; }

$('colorScheme').onchange = function(event) { state.valid = false; }

$('numColors').onchange = function(event) { state.valid = false; }

$('colorSmoothing').onchange = function(event) { state.valid = false; }

$('patternWidth').onchange = function(event) { state.valid = false; }

$('patternHeight').onchange = function(event) { state.valid = false; }

$('patternMask').oninput = function(event) { state.valid = false; console.log(undefined); }

$('resetButton').onclick = function(event)
{
	$('settingsForm').reset();
	// setTimeout(function() { location.hash = ''; }, 1);
	state.valid = false;
};

$('viewPNG').onclick = function(event) { window.location = state.canvas.toDataURL('image/png'); }

/*
 * When resizing the window, be sure to update all the canvas stuff.
 */
window.onresize = function(event) { state.valid = false; }
	
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