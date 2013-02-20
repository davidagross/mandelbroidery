function B = iphone5_cross_stitch(A,cMapFun,flipFirstMap,numColors)
% IPHONE5_CROSS_STITCH takes in a picture and outputs a cropped one
%
%USAGE
%   B = cross_stitch(A) will create an iPhone 5 cross-stitch patten from
%   the matrix A provided.
%
%   B = cross_stitch(A,cMapFun,flipFirstMap,numColors) will override the
%   default input configuration.
%
%INPUTS
%   A <77 x 35 ARRAY> will be passed to IMAGESCWITHNAN (a wrapped version
%   of IMAGESC) for plotting, after the corners and camera region have been
%   filled with NaN
%
%   cMapFun <1x1 FUNCTION_HANDLE> is the colormap function that will set the
%   tones of the image.  Could be a MATLAB built-in colormap or an
%   user-defined one.
%   * defaults to @autumn *
%
%   flipFirstMap <1x1 LOGICAL> denotes whether to flip the colormap first
%   before appending it or after. This is built for the madelbroidery
%   function which is plotting the divergence of points outside the
%   mandelbrot set.  In doing so, we'd like to have colors ramp up and back
%   down along a given colormap.  Experiment with this to see whether you
%   prefer "ascending" or "descending" colors.
%   * defaults to true *
%
%   numColors <1x1 NUMERIC> denotes the number of colors to specify to the
%   colormap function cMapFun.  This defines the course-ness of the color
%   map, and is useful when a limited number of colors will be available
%   for the project you are making.
%   * defaults to 6 *
%
%OUTPUTS
%
%   B <77 x 35 ARRAY> will be A filled with NaN in appropriate places
%   (corners and camera region).
%
%AUTHORSHIP
%   Created by David A. Gross on 19 Feb 2013 at 6:30 PM
%
% See Also
%   mandelbroidery, imagesc, colormap, colormapeditor, imagescwithnan

% configure colors
if nargin < 2, cMapFun = @autumn; end
if nargin < 3, flipFirstMap = true; end
if nargin < 4, numColors = 6; end

% transfer (this isn't fancy because we aren't resizing)
if ~isequal(size(A),[77,35])
    error('This isn''t an iPhone 5 case design');
end
B = A;
dims = size(B);

% masking
for r = 1:3
    B = rot90(B);
    B(1,1) = nan; B(1,2) = nan;
    B(2,1) = nan; 
end
B = rot90(B);

B(1,1:13) = nan;
B(2,1:15) = nan;
B(3,1:15) = nan;
B(4,1:16) = nan;
B(5,1:16) = nan;
B(6,1:16) = nan;
B(7,1:16) = nan;
B(8,2:16) = nan;
B(9,2:15) = nan;
B(10,3:15) = nan;
B(11,4:13) = nan;

% plotting
if flipFirstMap
    cMap = [flipud( cMapFun(numColors) ); cMapFun(numColors); 0 0 0];
else
    cMap = [cMapFun(numColors); flipud( cMapFun(numColors) ); 0 0 0];
end
imagescwithnan( B , cMap , [1 1 1] ); shading flat;
grid on; grid minor;
axis equal tight;
ax1 = gca;
set(ax1,'xtick',0:5:dims(2),'ytick',0:5:dims(1));
set(ax1,'yticklabel',dims(1)+1:-5:0);
ax2 = axes(rmfield(get(ax1), { ...
    'BeingDeleted','CurrentPoint','TightInset', ...
    'Title','Type','XLabel','YLabel','ZLabel', ...
    'Children'}));
set(ax2,'XAxisLocation','top',...
    'YAxisLocation','right',...
    'Color','none');
axes(ax1)

end

function h = imagescwithnan(a,cm,nanclr)
% IMAGESC with NaNs assigning a specific color to NaNs
% modified from http://stackoverflow.com/questions/8481324/ ...
% contrasting-color-for-nans-in-imagesc

%# find minimum and maximum
amin=min(a(:));
amax=max(a(:));
%# size of colormap
n = size(cm,1);
%# color step
dmap=(amax-amin)/n;

%# standard imagesc
him = imagesc(a);
%# add nan color to colormap
colormap([nanclr; cm]);
%# changing color limits
caxis([amin-dmap amax]);
%# place a colorbar
% hcb = colorbar;
%# change Y limit for colorbar to avoid showing NaN color
% ylim(hcb,[amin amax])

if nargout > 0
    h = him;
end

end
