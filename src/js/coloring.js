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
 * Convert hue-saturation-value/luminosity to RGB.
 *
 * Input ranges:
 *	 H =   [0, 360] (integer degrees)
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
function segment_rgb(rgb,segments)
{
	rgb[0] = Math.round(rgb[0] / 255 * segments) * 255 / segments;
	rgb[1] = Math.round(rgb[1] / 255 * segments) * 255 / segments;
	rgb[2] = Math.round(rgb[2] / 255 * segments) * 255 / segments;
	return rgb;
}
*/

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
	 
	if ( $('colorSmoothing').checked ) {
		return 5 + n - logHalfBase - Math.log(Math.log(Tr+Ti))*logBase;
	} else {
		return n
	}
}

function pickColorHSV1(steps, n, Tr, Ti, segments)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	var hue = 360.0*v/steps;
	hue = Math.round(hue / 360.0 * segments) * 360.0 / segments;
	var c = hsv_to_rgb(hue, 1.0, 1.0);
	c.push(255); // alpha
	return c;
}

function pickColorHSV2(steps, n, Tr, Ti, segments)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	var hue = 360.0*v/steps;
	hue = Math.round(hue / 360.0 * segments) * 360.0 / segments;
	var value = 10.0*v/steps;
	value = Math.round(value / 10.0 * segments) * 10.0 / segments;
	var c = hsv_to_rgb(hue, 1.0, value);
	c.push(255); // alpha
	return c;
}

function pickColorHSV3(steps, n, Tr, Ti, segments)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	var hue = 360.0*v/steps;
	hue = Math.round(hue / 360.0 * segments) * 360.0 / segments;
	var value = 10.0*v/steps;
	value = Math.round(value / 10.0 * segments) * 10.0 / segments;
	var c = hsv_to_rgb(hue, 1.0, value);

	// swap red and blue
	var t = c[0];
	c[0] = c[2];
	c[2] = t;

	c.push(255); // alpha
	return c;
}

function pickColorGrayscale(steps, n, Tr, Ti, segments)
{
	if ( n == steps ) // converged?
		return interiorColor;

	var v = smoothColor(steps, n, Tr, Ti);
	v = Math.floor(512.0*v/steps);
	
	v = Math.round(v / 512.0 * segments) * 512.0 / segments;	
	
	if ( v > 255 ) v = 255;
	return [v, v, v, 255];
}

function pickColorGrayscale2(steps, n, Tr, Ti, segments)
{
	if ( n == steps ) { // converged?
		var c = 255 - Math.floor(255.0*Math.sqrt(Tr+Ti)) % 255;
		if ( c < 0 ) c = 0;
		if ( c > 255 ) c = 255;
		
		c = Math.round(c / 255.0 * segments) * 255.0 / segments;
		
		return [c, c, c, 255];
	}

	return pickColorGrayscale(steps, n, Tr, Ti);
}