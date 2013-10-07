#! /bin/sh

git checkout master

docco frame.core.js
docco frame.indexeddb.js
docco frome.webgl.js
git add .
git commit -am "Updated annonated source"

rm -rf /tmp/frame
mkdir /tmp/frame
cp -R docs/ /tmp/frame/docs
cp -R examples/ /tmp/frame/examples

rm /tmp/frame/docs/frame.core.js

cp frame.core.js /tmp/frame/docs/frame.core.js
cp frame.indexeddb.js /tmp/frame/docs/frame.indexeddb.js
cp frame.webgl.js /tmp/frame/docs/frame.webgl.js
git checkout gh-pages

rm -rf *
mv /tmp/frame/docs/* .
mv /tmp/frame/examples .

git add .
git commit -am "Updates pages."
git push

git checkout master
