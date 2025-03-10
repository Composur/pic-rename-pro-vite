#!/bin/bash
mkdir -p a.iconset
sips -z 16 16     a.png --out a.iconset/icon_16x16.png
sips -z 32 32     a.png --out a.iconset/icon_16x16@2x.png
sips -z 32 32     a.png --out a.iconset/icon_32x32.png
sips -z 64 64     a.png --out a.iconset/icon_32x32@2x.png
sips -z 128 128   a.png --out a.iconset/icon_128x128.png
sips -z 256 256   a.png --out a.iconset/icon_128x128@2x.png
sips -z 256 256   a.png --out a.iconset/icon_256x256.png
sips -z 512 512   a.png --out a.iconset/icon_256x256@2x.png
sips -z 512 512   a.png --out a.iconset/icon_512x512.png
sips -z 1024 1024 a.png --out a.iconset/icon_512x512@2x.png
iconutil -c icns a.iconset -o a.icns