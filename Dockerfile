FROM mhart/alpine-node
# RUN wget -O - https://github.com/mozilla/DeepSpeech/releases/download/v0.3.0/deepspeech-0.3.0-models.tar.gz | tar xvfz -

WORKDIR /src
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
