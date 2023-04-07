#!/bin/sh

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN not provided."
  exit 1
fi

docker build -t dts-service-content --build-arg GITHUB_TOKEN=${GITHUB_TOKEN} .
docker run -ti --rm -p 3000:3000 -e OFF_AWS=1 -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY --name="dts-service-content" -h "dts-service-content" dts-service-content
