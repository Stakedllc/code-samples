FROM nikolaik/python-nodejs:latest

COPY package.json .
RUN npm install

COPY *.js ./
COPY *.json ./

ADD docker-entrypoint.sh /
ENTRYPOINT ["sh", "docker-entrypoint.sh", "run"]