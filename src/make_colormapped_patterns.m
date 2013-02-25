% run this script to create a demo of all of the colormaps w/ defaults

cMapFuns = {...
    @autumn % varies smoothly from red, through orange, to yellow.
    @bone % is a grayscale colormap with a higher value for the blue component. This colormap is useful for adding an "electronic" look to grayscale images.
    @colorcube % contains as many regularly spaced colors in RGB color space as possible, while attempting to provide more steps of gray, pure red, pure green, and pure blue.
    @cool % consists of colors that are shades of cyan and magenta. It varies smoothly from cyan to magenta.
    @copper % varies smoothly from black to bright copper.
    @flag % consists of the colors red, white, blue, and black. This colormap completely changes color with each index increment.
    @gray % returns a linear grayscale colormap.
    @hot % varies smoothly from black through shades of red, orange, and yellow, to white.
    @hsv % varies the hue component of the hue-saturation-value color model. The colors begin with red, pass through yellow, green, cyan, blue, magenta, and return to red. The colormap is particularly appropriate for displaying periodic functions. hsv(m) is the same as hsv2rgb([h ones(m,2)]) where h is the linear ramp, h = (0:m?1)'/m.
    @jet % ranges from blue to red, and passes through the colors cyan, yellow, and orange. It is a variation of the hsv colormap. The jet colormap is associated with an astrophysical fluid jet simulation from the National Center for Supercomputer Applications. See Examples.
    @lines % produces a colormap of colors specified by the axes ColorOrder property and a shade of gray.
    @pink % contains pastel shades of pink. The pink colormap provides sepia tone colorization of grayscale photographs.
    @prism % repeats the six colors red, orange, yellow, green, blue, and violet.
    @spring % consists of colors that are shades of magenta and yellow.
    @summer % consists of colors that are shades of green and yellow.
    @white % is an all white monochrome colormap.
    @winter}; % consists of colors that are shades of blue and green.

for f = 1:numel(cMapFuns)
    iphone5_cross_stitch(mandelbroidery,cMapFuns{f});
    saveas(gcf,sprintf(fullfile('png','mandelbroidery_%s.png'),...
        func2str(cMapFuns{f})));
end