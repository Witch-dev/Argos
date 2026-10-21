from PIL import Image, ImageDraw, ImageChops
dog=Image.open('psf-dog.png').convert('L')
peg=Image.open('Pegasus_(PSF).png').convert('L')
# 1. remove the ground dashes (white boxes between and beside the paws)
d=ImageDraw.Draw(dog)
d.rectangle((990,975,1500,1095),fill=255)
d.rectangle((850,1000,990,1095),fill=255)
d.rectangle((840,1180,920,1250),fill=255)
d.rectangle((1890,1010,1960,1060),fill=255)
# 2. cut the wing along its outline (full-size Pegasus coordinates)
poly=[(760,190),(790,110),(860,68),(960,60),(1060,92),(1250,118),(1440,138),(1590,152),(1700,198),(1772,280),(1762,372),(1700,425),(1580,482),(1450,522),(1345,518),(1352,600),(1372,700),(1382,800),(1352,892),(1290,898),(1200,882),(1100,832),(1000,762),(900,692),(858,672),(828,652),(868,622),(848,522),(798,422),(768,332)]
mask=Image.new('L',peg.size,0); ImageDraw.Draw(mask).polygon(poly,fill=255)
box=mask.getbbox(); wing=peg.crop(box); wmask=mask.crop(box)
root=(860-box[0],660-box[1])
def compose(scale, at, flip=False, base=None):
    w=wing.resize((round(wing.width*scale),round(wing.height*scale)),Image.LANCZOS)
    m=wmask.resize(w.size,Image.LANCZOS)
    rx,ry=round(root[0]*scale),round(root[1]*scale)
    top=max(0,ry-at[1]+40)                      # grow the canvas upward if the wing pokes out
    canvas=Image.new('L',(dog.width,dog.height+top),255); canvas.paste(dog if base is None else base,(0,top))
    canvas.paste(w,(at[0]-rx,at[1]+top-ry),m)
    return canvas
def ink(gray,color):
    alpha=ImageChops.invert(gray).point(lambda v: 0 if v<40 else min(255,int((v-40)*255/180)))
    out=Image.new('RGBA',gray.size,color+(0,)); out.putalpha(alpha)
    return out.crop(alpha.getbbox())
GREEN=(0x2e,0x5e,0x4e)
plain=ink(dog,GREEN); plain.save('logo-plain.png')
winged=ink(compose(0.62,(930,540)),GREEN); winged.save('logo-winged.png')
winged_big=ink(compose(0.78,(900,560)),GREEN); winged_big.save('logo-winged-big.png')
print(plain.size, winged.size, winged_big.size)

from PIL import ImageFilter
def silhouette(gray, close=11):
    dark=gray.point(lambda v: 255 if v<150 else 0)
    grown=dark.filter(ImageFilter.MaxFilter(close))
    ImageDraw.floodfill(grown,(0,0),128)
    solid=grown.point(lambda v: 0 if v==128 else 255).filter(ImageFilter.MinFilter(close))
    return ImageChops.invert(solid)          # black shape on white, like the drawings
for name,g in (('plain',dog),('winged',compose(0.62,(930,540)))):
    sil=silhouette(g)
    ink(sil,GREEN).save(f'logo-{name}-solid.png')
    # a middle version: the drawing on top of a pale fill of its own silhouette, lines thickened a little
    thick=g.filter(ImageFilter.MinFilter(5))
    ink(thick,GREEN).save(f'logo-{name}-bold.png')

# Winged silhouette with a cream gap where the wing lies on the back
blank=Image.new('L',dog.size,255)
wing_only=compose(0.62,(930,540),base=blank)
body=silhouette(dog)
# close the edge where the wing was cut from the horse, so the fill can't leak into the light lower feathers
peg_closed=peg.copy(); ImageDraw.Draw(peg_closed).line([(1352,892),(1290,898),(1200,882),(1100,832),(1000,762),(900,692),(858,672),(828,652),(868,622)],fill=0,width=14)
wing_saved=wing; wing=peg_closed.crop(box)
wingsil=silhouette(compose(0.62,(930,540),base=blank), close=7)
wing=wing_saved
top=wing_only.height-dog.height
bodyc=Image.new('L',wing_only.size,255); bodyc.paste(body,(0,top))
wdark=ImageChops.invert(wingsil)                      # wing = 255
ring=wdark.filter(ImageFilter.MaxFilter(15))          # wing grown by ~7px
shape=ImageChops.invert(bodyc)                        # body = 255
shape=ImageChops.subtract(shape,ring)                 # cut the gap out of the body
shape=ImageChops.lighter(shape,wdark)                 # put the wing back on top
ink(ImageChops.invert(shape),GREEN).save('logo-winged-solid.png')
