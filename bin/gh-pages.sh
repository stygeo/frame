#! /bin/sh

git checkout master

docco frame.js
git commit -am "Updated annonated source"

rm -rf /tmp/frame
cp -R docs/ /tmp/frame
rm /tmp/frame/frame.js
cp frame.js /tmp/frame/frame.js
git checkout gh-pages

rm -rf *
mv /tmp/frame/* .
git commit -am "Updates pages."
git push

git checkout master
