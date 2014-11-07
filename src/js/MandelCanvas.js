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
	this.maybeDragging = false; // Keep track of when we are dragging the grid
	this.startDrag = {x: null, y: null}; // See mousedown and mousemove events for explanation
	this.midDrag = this.startDrag;
	this.endDrag = this.startDrag;
	this.zooming = false;
	this.zoomDelta = 0;
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
		myState.startDrag = myState.getMouse(e);
		myState.midDrag = myState.startDrag;
		myState.maybeDragging = true;
		myState.dragged = false;
	}, true);
	
	canvas.addEventListener('touchstart', function(e) {
		myState.startDrag = myState.getMouse(e);
		myState.midDrag = myState.startDrag;
		myState.maybeDragging = true;
		myState.dragged = false;
	}, false);
	
	canvas.addEventListener('mousemove', function(e) {
		if (myState.maybeDragging){
			myState.endDrag = myState.getMouse(e);
			myState.dragged = true;
			myState.valid = false; // Something's dragging so we must redraw
		}
	}, true);
	
	canvas.addEventListener('touchmove', function(e) {
		if (myState.maybeDragging){
			myState.endDrag = myState.getMouse(e);
			myState.dragged = true;
			myState.valid = false; // Something's dragging so we must redraw
		}
	}, false);
	
	canvas.addEventListener('mouseup', function(e) {
		myState.endDrag = myState.getMouse(e);
		myState.maybeDragging = false;
		myState.dragged = (myState.startDrag.x != myState.endDrag.x && myState.startDrag.y != myState.endDrag.y); 
		myState.valid = false; // Something may have dragged or clicked so we must redraw
	}, true);
	
	canvas.addEventListener('touchend', function(e) {
		myState.endDrag = myState.getMouse(e);
		myState.maybeDragging = false;
		myState.dragged = (myState.startDrag.x != myState.endDrag.x && myState.startDrag.y != myState.endDrag.y); 
		myState.valid = false; // Something may have dragged or clicked so we must redraw
	}, false);
	
	// modified from http://www.sitepoint.com/html5-javascript-mouse-wheel/
	canvas.addEventListener("mousewheel", function(e) {
		// cross-browser wheel delta
		var e = window.event || e;
		myState.startDrag = myState.getMouse(e);
		myState.zooming = true;
		myState.zoomDelta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		myState.valid = false;
		if (myState.zoomDelta == 0) { myState.zooming = false; myState.valid = true; }
	}, true);
	// canvas.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
	
	this.interval = 20;
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
		
		var pw = $('patternWidth').value;
		var ph = $('patternHeight').value;
		
		var size = Math.min(this.canvas.width / (1*pw+10.0), this.canvas.height / (1*ph+10.0));
		
		// var gw = Math.round(this.canvas.width / size);
		// var gh = Math.round(this.canvas.height / size);
		// var offx = (this.canvas.width  - gw * size) / 2.0;
		// var offy = (this.canvas.height - gh * size) / 2.0;
		
		var offx = (this.canvas.width  - pw * size) / 2.0; // buffx
		var offy = (this.canvas.height - ph * size) / 2.0; // buffy
		
		var realRange = this.grid.realRange;
		var complexRange = this.grid.complexRange;
						
		// ** Add stuff you want drawn in the background all the time here **
		if (this.dragged) {
			// if dragging, recenter based on the distance of the drag
			var xDiff = this.endDrag.x - this.midDrag.x;
			var yDiff = this.endDrag.y - this.midDrag.y;
			var realDiff    =    this.grid.realExtent() / (pw * size) * xDiff;
			var complexDiff = this.grid.complexExtent() / (ph * size) * yDiff;
			// var realDiff    =    this.grid.realExtent() / (gw * size) * xDiff;
			// var complexDiff = this.grid.complexExtent() / (gh * size) * yDiff;
			
			// recenter to end of the drag
			realRange[0] -= realDiff;
			realRange[1] -= realDiff;
			complexRange[0] -= complexDiff;
			complexRange[1] -= complexDiff;
			
			// so we don't accelerate away
			this.midDrag = this.endDrag;
		} 
		
		if (this.zooming) {
			// find difference to center
			xDiff =  this.canvas.width/2.0 - this.startDrag.x;
			yDiff = this.canvas.height/2.0 - this.startDrag.y;
			var realDiff    =    this.grid.realExtent() / (pw * size) * xDiff;
			var complexDiff = this.grid.complexExtent() / (ph * size) * yDiff;
			// var realDiff    =    this.grid.realExtent() / (gw * size) * xDiff;
			// var complexDiff = this.grid.complexExtent() / (gh * size) * yDiff;
				
			// zoom around mouse location
			var zoom    = this.zoomDelta / 8.0;
			realRange[0]    += zoom * (this.grid.realExtent()   /2.0 - realDiff);
			realRange[1]    -= zoom * (this.grid.realExtent()   /2.0 + realDiff);
			complexRange[0] += zoom * (this.grid.complexExtent()/2.0 - complexDiff);
			complexRange[1] -= zoom * (this.grid.complexExtent()/2.0 + complexDiff);
			
			this.zooming = false;
		}
				
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
		// this.grid = new MandelGrid(gw,gh,realRange,complexRange,escapeRadius,steps);
		
		// updateHashTag(steps);
		// updateInfoBox();

		this.grid.draw(ctx, steps, getColorPicker(), size, offx, offy);
		
		// ** Add stuff you want drawn on top all the time here **
		// this.ctx.fillStyle = "rgba(0,0,0," + $('patternMask').value + ")";
		// this.ctx.fillRect(              0,               0, this.canvas.width,   buffy);
		// this.ctx.fillRect(              0, buffy + ph*size, this.canvas.width,   buffy);
		// this.ctx.fillRect(              0,           buffy,             buffx, ph*size);
		// this.ctx.fillRect(buffx + pw*size,           buffy,             buffx, ph*size);
		
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
	offsetY += this.stylePaddingTop  + this.styleBorderTop  + this.htmlTop;

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