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
 
function MandelGrid(width, height, realRange, complexRange, escapeRadius, iterations) {
	this.width = width;
	this.height = height;
	this.realRange = realRange;
	this.complexRange = complexRange;
	this.dx = (realRange[1] - realRange[0]) / (0.5 + (width-1));
	this.dy = (complexRange[1] - complexRange[0]) / (0.5 + (height-1));
	this.escapeRadius = escapeRadius;
	this.iterations = iterations;
	this.cells = this.mandel();
}

// Build a grid of the specified size
MandelGrid.prototype.mandel = function () {
	var cells = [];
  
	var x = y = 0;
  
	for (var i = 0; i < this.height; i++) {
	
		var row = cells[i] = [];
		y = this.complexRange[0] + i*this.dy;

		for (var j = 0; j < this.width; j++) {
			
			x = this.realRange[0] + j*this.dx;
			row.push(iterateEquation(x, y, this.escapeRadius, this.iterations));
		}
	}

	return cells;
};

/*
 * Main renderer equation.
 *
 * Returns number of iterations and values of Z_{n}^2 = Tr + Ti at the time
 * we either converged (n == iterations) or diverged.	We use these to
 * determined the color at the current cell.
 *
 * The Mandelbrot set is rendered taking
 *
 *		 Z_{n+1} = Z_{n} + C
 *
 * with C = x + iy, based on the "look at" coordinates.
 *
 * The Julia set can be rendered by taking
 *
 *		 Z_{0} = C = x + iy
 *		 Z_{n+1} = Z_{n} + K
 *
 * for some arbitrary constant K.	The point C for Z_{0} must be the
 * current pixel we're rendering, but K could be based on the "look at"
 * coordinate, or by letting the user select a point on the screen.
 */
function iterateEquation(Cr, Ci, escapeRadius, iterations)
{
	var Zr = 0;
	var Zi = 0;
	var Tr = 0;
	var Ti = 0;
	var n  = 0;
	
	for ( ; n<iterations && (Tr+Ti)<=escapeRadius; ++n ) {
		Zi = 2 * Zr * Zi + Ci;
		Zr = Tr - Ti + Cr;
		Tr = Zr * Zr;
		Ti = Zi * Zi;
	}

	/*
	 * Four more iterations to decrease error term;
	 * see http://linas.org/art-gallery/escape/escape.html
	 */
	for ( var e=0; e<4; ++e ) {
		Zi = 2 * Zr * Zi + Ci;
		Zr = Tr - Ti + Cr;
		Tr = Zr * Zr;
		Ti = Zi * Zi;
	}

	return [n, Tr, Ti];
}
