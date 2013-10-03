#! /bin/sh

git checkout master

docco frame.core.js
docco docs/getting-started.js
git commit -am "Updated annonated source"

rm -rf /tmp/frame
cp -R docs/ /tmp/frame
rm /tmp/frame/frame.core.js
cp frame.core.js /tmp/frame/frame.core.js
git checkout gh-pages

rm -rf *
mv /tmp/frame/* .
git add .
git commit -am "Updates pages."
git push

git checkout master
