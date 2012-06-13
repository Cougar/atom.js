# atom.js

Controller software for the [Home Automation Project](http://projekt.auml.se)
based on Node.js.

See `examples` directory for example usage.

Edit examples/server-with-udp.js for you setup then start with  

    $ node examples/server-with-udp.js

## Developer notes

### Setup

Install node.js and stuff  

    $ sudo apt-get install nodejs npm libexpat1-dev

Fork the repo and then run `npm install`.

Download can protocol file  

    $ node download-protocol.js

Run the tests with `make test`.
[jshint](https://github.com/jshint/node-jshint) code using `make
lint`.
