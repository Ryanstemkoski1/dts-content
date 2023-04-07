FROM node:14

ARG GITHUB_TOKEN
ARG VERSION

ENV PORT 3000
EXPOSE 3000

RUN apt-get update -y \
  && apt-get install -y unzip curl \
  && curl -o daemon.zip https://s3.us-east-2.amazonaws.com/aws-xray-assets.us-east-2/xray-daemon/aws-xray-daemon-linux-3.x.zip \
  && unzip daemon.zip && cp xray /usr/bin/xray && rm daemon.zip
RUN npm install forever -g

WORKDIR /usr/src/app

COPY .npmrc .
COPY run.sh .
COPY package.json .
COPY package-lock.json .
COPY rds.pem .

RUN ADBLOCK=true npm ci --production --prefer-offline --no-audit
RUN rm -f .npmrc

COPY ./dist ./dist

CMD sh run.sh "$VERSION"
