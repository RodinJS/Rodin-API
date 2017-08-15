FROM rodinvr/nodejs:6

MAINTAINER Grigor Khachatryan <g@yvn.io>

ADD . /var/www/api
WORKDIR /var/www/api
RUN npm install

EXPOSE 3000

CMD ["sh", "-c", "export NODE_ENV=testing"]