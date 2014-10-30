function A = mandelbroidery(center, window, aspectRatio, grid, depth)
% MANDELBROIDERY - Mandelbrot Embroidery Pattern
%
%USAGE
%   A = mandelbroidery() will create a matrix of color intensities based on
%   rates of divergence from the edge of the mandelbrot set
%
%   A = mandelbroidery(center, window, aspectRatio, grid, depth) will
%   override the default values for input configurations.
%
%INPUTS
%
%   center <1x1 COMPLEX> will set the center of the view
%   * defaults to .14 + .93*1i *
%
%   window <1x1 NUMERIC> sets the width of the viewing window along the
%   real line
%   * defaults to .1 *
%
%   aspectRatio <1x1 NUMERIC> sets the height-to-width ratio of the viewing
%   window
%   * defaults to 2.2, appropriate for an iPhone 5 cross-stitch case *
%
%   grid <1x2 NUMERIC> sets the grid density of the complex seeds to check
%   * defaults to [35, 77], appropriate for an iPhone 5 cross-stitch case *
%   NOTE these dimensions are the tranpose of the output, as they are
%   passed to MESHGRID, which does that when used this way.
%
%   depth <1x1 NUMERIC> sets the depth at which we decide a point is or is
%   not in the mandelbrot set.  Experiment with this for your artistic
%   pleasure!
%   * defaults to 1000 *
%
%REFERENCES
%   [1] http://blogs.mathworks.com/loren/ ...
%       2011/07/18/a-mandelbrot-set-on-the-gpu/
%   [2] http://www.mathworks.com/moler/exm/chapters/mandelbrot.pdf
%
%AUTHORSHIP
%   Created by David A. Gross on 19 Feb 2013 at 8:43 AM
%
% See Also
%   iphone5_cross_stich

% configure inputs
if nargin < 1, center = .14 + .93*1i; end
if nargin < 2, window = .1; end
if nargin < 3, aspectRatio = 2.2; end
if nargin < 4, grid = [35,77]; end
if nargin < 5, depth = 1000; end

% configure sizing
xlim = [-.5, .5] * window;
ylim = aspectRatio*xlim;
x = linspace( xlim(1), xlim(2), grid(1) );
y = linspace( ylim(1), ylim(2), grid(2) );

% make grid
[xGrid,yGrid] = meshgrid( x - real(center), y - imag(center));
c = xGrid + 1i * yGrid;
count = zeros(size(c));

% calculate
z = c;
for k = 0:depth
   
    z = z.*z + c;
    inside = abs(z) < 2;
    count = count + inside;
    
end
A = log( count+1 );

end