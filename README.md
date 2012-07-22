# atom.js

Controller software for the [Home Automation Project](http://projekt.auml.se)
based on Node.js.

See `examples` directory for example usage.

## Setup

Install node.js and stuff  

    $ sudo apt-get install nodejs npm libexpat1-dev

Fork the repo and then run `npm install`.

Download can protocol file  

    $ node download-protocol.js

## Usage with ethernet node (UDP)

Edit examples/server-with-udp.js for you setup then start with  

    $ node examples/server-with-udp.js

You can run the atomic client by running

    $ ./bin/atomic [port] [host]

### Tunneling over SSH

If your ethernet node is on a remote network and you want to run
atom.js on your local computer you can instead use the TCP adapter. 

Open an SSH tunnel to a remote computer on the same network as the
ethernet node by running

    $ ssh -L 9500:localhost:9500 example.org
    
replacing `example.org` appropriately. When logged in, issue the
following commands to forward TCP traffic from the SSH tunnel to the
ethernet node over UDP:

    $ mkfifo /tmp/atom-udp
    $ nc -k -l localhost 9500 < /tmp/atom-udp | nc -u -p 1100 192.168.1.250 1100 > /tmp/atom-udp

Replace the IP address with the one of your ethernet node.

Edit `examples/server-tunnel-tcp.js` for you setup then start with 

    $ node examples/server-tunnel-tcp.js



## Developer notes

Run the tests with `make test`.
[jshint](https://github.com/jshint/node-jshint) code using `make
lint`.

