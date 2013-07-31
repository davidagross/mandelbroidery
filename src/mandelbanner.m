imagesc((mandelbroidery(.14+1*1i, .1, 4,30*[1,4])')), axis equal
set(gca,'Position',[0 0 1 1])
axis off
set(gcf,'PaperPositionMode','auto')
print(gcf,'-dpng','mandel.png')