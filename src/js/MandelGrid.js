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
	this.width = width || 50;
	this.height = height || 50;
	this.realRange = realRange || [-2.6,1.4];
	this.complexRange = complexRange || [-2,2];
	this.dx = (this.realRange[1] - this.realRange[0]) / (0.5 + (this.width-1));
	this.dy = (this.complexRange[1] - this.complexRange[0]) / (0.5 + (this.height-1));
	this.escapeRadius = escapeRadius || 10.0;
	this.iterations = iterations;
	this.mandel();
}

MandelGrid.prototype.realExtent = function() { return this.realRange[1] - this.realRange[0]; }

MandelGrid.prototype.complexExtent = function() { return this.complexRange[1] - this.complexRange[0]; }

// Build a grid of the specified size
MandelGrid.prototype.mandel = function () {
	this.cells = [];
  
	var x = y = 0;
  
	for (var i = 0; i < this.height; i++) {
	
		var row = this.cells[i] = [];
		y = this.complexRange[0] + i*this.dy;

		for (var j = 0; j < this.width; j++) {
			
			x = this.realRange[0] + j*this.dx;
			row.push(iterateEquation(x, y, this.escapeRadius, this.iterations));
		}
	}

};

MandelGrid.prototype.draw = function(ctx, steps, pickColor, size, offx, offy) {

	for ( var i = 0 ; i < this.height ; i++ ) {
		for ( var j = 0; j < this.width ; j++ ) {

			var p = this.cells[i][j];
			var color = pickColor(steps, p[0], p[1], p[2]);
			
			ctx.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + ",255)";
			ctx.fillRect(j * size + offx, i * size + offy, size, size);
			
		}
	}
}

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
