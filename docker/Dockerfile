# pulls node 14 lts version, which is based on debian9 (AKA stretch)
FROM node:14


# set -e is a bash command to Exit immediately if a command exits with a non-zero status
RUN set -e && \
    apt-get update  && \
    apt-get install -y ca-certificates

RUN set -e && \
    mkdir /home/node/app && \
    chown node /home/node/app && \
    chmod 755 /home/node/app


WORKDIR /home/node/app
USER node

RUN set -e && \
    git config --global user.email "you@example.com" && \
    git config --global user.name "Your Name"

CMD npm install && npm run start-docker-dev