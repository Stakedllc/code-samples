FROM nikolaik/python-nodejs:latest

COPY package.json .
RUN npm install
COPY *.js ./

COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY *.py ./

COPY contracts .
COPY data .

ADD docker-entrypoint.sh /
ENTRYPOINT ["sh", "docker-entrypoint.sh", "run"]