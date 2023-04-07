#!/bin/bash

if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV not provided."
  exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN not provided."
  exit 1
fi

if [ -z "$DOCKER_TOKEN" ]; then
  echo "DOCKER_TOKEN not provided."
  exit 1
fi

DOCKER_USER=artema
ACCOUNT_ID=430104099533
REGION=us-west-2
NAME=dts-service-content-$NODE_ENV
BUCKET=dts-common-$NODE_ENV-build

VERSION=`git rev-parse HEAD`

if [ -z "$VERSION" ]; then
  echo "No version number found."
  exit 1
fi

ZIP=$NAME.zip
S3_KEY=$VERSION.zip
ECR=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo Build $NAME:$VERSION started

echo aws configure set default.region $REGION
aws configure set default.region $REGION

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR

echo docker login --username $DOCKER_USER
docker login --username $DOCKER_USER --password $DOCKER_TOKEN

echo docker pull $ECR/$NAME:latest
docker pull $ECR/$NAME:latest || true

echo docker build -t $NAME:$VERSION --cache-from $ECR/$NAME:latest --build-arg GITHUB_TOKEN=GITHUB_TOKEN --build-arg VERSION=${VERSION} .
docker build -t $NAME:$VERSION --cache-from $ECR/$NAME:latest --build-arg GITHUB_TOKEN=${GITHUB_TOKEN} --build-arg VERSION=${VERSION} .

echo docker tag $NAME:$VERSION $ECR/$NAME:$VERSION
docker tag $NAME:$VERSION $ECR/$NAME:$VERSION

echo docker tag $NAME:$VERSION $ECR/$NAME:latest
docker tag $NAME:$VERSION $ECR/$NAME:latest

echo docker push $ECR/$NAME:$VERSION
docker push $ECR/$NAME:$VERSION

echo aws ecr batch-delete-image --repository-name $NAME --image-ids imageTag=latest
aws ecr batch-delete-image --repository-name $NAME --image-ids imageTag=latest

echo docker push $ECR/$NAME:latest
docker push $ECR/$NAME:latest || true

rm -rf .server

cp -R server .server

cd .server

sed -i='' "s/<ACCOUNT_ID>/$ACCOUNT_ID/" docker-compose.yml
sed -i='' "s/<REGION>/$REGION/" docker-compose.yml
sed -i='' "s/<NAME>/$NAME/" docker-compose.yml
sed -i='' "s/<TAG>/$VERSION/" docker-compose.yml
sed -i='' "s/<ENV>/$NODE_ENV/" docker-compose.yml

zip -r $NAME.zip .
aws s3 cp $NAME.zip s3://$BUCKET/$NAME/$VERSION.zip
cd ..

aws elasticbeanstalk create-application-version --application-name $NAME \
    --version-label $VERSION --source-bundle S3Bucket=$BUCKET,S3Key=$NAME/$VERSION.zip \
    --region $REGION

aws elasticbeanstalk update-environment --environment-name $NAME \
      --version-label $VERSION

# apollo service:push \
#   --localSchemaFile=./schema.graphql \
#   --graph=$APOLLO_GRAPH \
#   --variant=$NODE_ENV \
#   --serviceName=content \
#   --serviceURL=http://$SERVER_HOST:$SERVER_PORT/graphql
