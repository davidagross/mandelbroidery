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
 
 // with help from http://simonsarris.com/blog/510-making-html5-canvas-useful !!!
 
 function MandelCanvas(canvas) {
  
	// **** First some setup! ****
	
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
  
	this.canvas = canvas;
	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.getContext('2d');
	// This complicates things a little but but fixes mouse co-ordinate problems
	// when there's a border or padding. See getMouse for more detail
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
	if (document.defaultView && document.defaultView.getComputedStyle) {
		this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
		this.stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
		this.styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
		this.styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
	}
	// Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
	// They will mess up mouse coordinates and this fixes that
	var html = document.body.parentNode;
	this.htmlTop = html.offsetTop;
	this.htmlLeft = html.offsetLeft;

	// **** Keep track of state! ****

	this.valid = false; // when set to true, the canvas will redraw everything
	this.dragging = false; // Keep track of when we are dragging the grid
	this.startDragX = 0; // See mousedown and mousemove events for explanation
	this.startDragY = 0
	this.endDragX = null;
	this.endDragY = null;
	this.grid = new MandelGrid();
  
	// This is an example of a closure!
	// Right here "this" means the MandelCanvas. But we are making events on the Canvas itself,
	// and when the events are fired on the canvas the variable "this" is going to mean the canvas!
	// Since we still want to use this particular MandelCanvas in the events we have to save a reference to it.
	// This is our reference!
	var myState = this;
  
	//fixes a problem where double clicking causes text to get selected on the canvas
	canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false; }, false);
  
	// Up, down, and move are for dragging
	canvas.addEventListener('mousedown', function(e) {
		var mouse = myState.getMouse(e);
		myState.startDragX = mouse.x;
		myState.startDragY = mouse.y;
		myState.dragging = true;
		myState.valid = false;
	}, true);
	
	canvas.addEventListener('mousemove', function(e) {
		if (myState.dragging){
			var mouse = myState.getMouse(e);
			// We don't want to drag the object by its top-left corner,
			// we want to drag from where we clicked.
			// Thats why we saved the offset and use it here
			myState.endDragX = mouse.x;
			myState.endDragY = mouse.y;
			myState.valid = false; // Something's dragging so we must redraw
		}
	}, true);
	
	canvas.addEventListener('mouseup', function(e) {
		myState.dragging = false;
	}, true);
	
	this.interval = 30;
	setInterval(function() { myState.draw(); }, myState.interval);
	
}

MandelCanvas.prototype.clear = function() {
	this.ctx.clearRect(0, 0, this.width, this.height);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
MandelCanvas.prototype.draw = function() {
	// if our state is invalid, redraw and validate!
	if (!this.valid) {
		var ctx = this.ctx;
		this.clear();

		var size = 10;
		
		var pw = $('patternWidth').value;
		var ph = $('patternHeight').value;
		
		var offx = (this.canvas.width - pw * size)/2;
		var offy = (this.canvas.height - ph * size)/2;
		
		var xDiff = yDiff = 0;
		
		// ** Add stuff you want drawn in the background all the time here **
		if (this.endDragX != null && this.endDragY != null) {
			var xDiff = this.endDragX - this.startDragX;
			var yDiff = this.endDragY - this.startDragY;
			this.startDragX = this.endDragX;
			this.startDragY = this.endDragY;
		}
		
		this.endDragX =this.endDragY = null;
		
		var realRange = this.grid.realRange;
		var complexRange = this.grid.complexRange;

		var realDiff = this.grid.realExtent() / (pw * size) * xDiff;
		var complexDiff = this.grid.complexExtent() / (ph * size) * yDiff;
		
		realRange[0] -= realDiff;
		realRange[1] -= realDiff;
		complexRange[0] -= complexDiff;
		complexRange[1] -= complexDiff;
		
		// adjustAspectRatio(xRange, yRange, this);
		
		var steps = parseInt($('steps').value, 10);

		if ( $('autoIterations').checked ) {
			var f = Math.sqrt(
							0.001+2.0 * Math.min(
								Math.abs(this.grid.realExtent()),
								Math.abs(this.grid.complexExtent())));
			steps = Math.floor(223.0/f);
			$('steps').value = String(steps);
		}

		var escapeRadius = Math.pow(parseFloat($('escapeRadius').value), 2.0);
		
		var numColors = $('numColors').value;
				
		this.grid = new MandelGrid(pw,ph,realRange,complexRange,escapeRadius,steps);
		
		// updateHashTag(steps);
		// updateInfoBox();

		this.grid.draw(ctx, steps, getColorPicker(), size, offx, offy);
		
		// ** Add stuff you want drawn on top all the time here **

		this.valid = true;
	}
}

MandelCanvas.prototype.getMouse = function(e) {
	var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;

	// Compute the total offset
	if (element.offsetParent !== undefined) {
		do {
			offsetX += element.offsetLeft;
			offsetY += element.offsetTop;
		} while ((element = element.offsetParent));
	}

	// Add padding and border style widths to offset
	// Also add the offsets in case there's a position:fixed bar
	offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
	offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;

	mx = e.pageX - offsetX;
	my = e.pageY - offsetY;

	// We return a simple javascript object (a hash) with x and y defined
	return {x: mx, y: my};
}

/*
 * Update URL's hash with render parameters so we can pass it around.
 */
MandelCanvas.prototype.updateHashTag = function(iterations)
{
	var radius = $('escapeRadius').value;
	var scheme = $('colorScheme').value;

	location.hash = 'zoom=' + zoom + '&' +
					'lookAt=' + lookAt + '&' +
					'iterations=' + iterations + '&' +
					'escapeRadius=' + this.grid.radius + '&' +
					'colorScheme=' + scheme;
}

var state = new MandelCanvas($('canvasMandelbrot'));