from udacity/nodejs:6.7.0

ADD . /app

RUN npm install

CMD ["npm", "start"]
