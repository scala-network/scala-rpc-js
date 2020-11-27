# Scala RPC Daemon and RPC Wallet Javascript Library

[![NPM](https://nodei.co/npm/@scala/scala-rpc.png)](https://nodei.co/npm/@scala/scala-rpc/)

Javascript library to interact with RPC Daemon and RPC Wallet.\
All requests are queued. Most functions are async.

Since version 0.2.0 the RPCDaemon and RPCWallet objects are created using a factory function instead of declaring the object with "new".

There is no need to connect and disconnect the underlying socket anymore.

The library supports HTTP, HTTPS and digest authentication.

The library use an axios interceptor to implement digest authentication.

Digest authentication is activated as soon as a username and a password is supplied during object creation.

Once initialized simply use the query functions.


## RPCDaemon without Digest Authentication
Please refer to the [documentation](https://scala.github.io/scala-rpc-js/module-RPCDaemon.html) and look at the unit tests.
```javascript
const rpcDaemon = require('@scala/scala-rpc').RPCDaemon

const daemonClient = rpcDaemon.createDaemonClient({
  url: 'http://127.0.0.1:39994'
})
// When using a self signed certificate with HTTPS you need to set the function sslRejectUnauthorized to false.
daemonClient.sslRejectUnauthorized(false)
```


## RPCDaemon with Digest Authentication
Please refer to the [documentation](https://scala.github.io/scala-rpc-js/module-RPCDaemon.html) and look at the unit tests.
```javascript
const rpcDaemon = require('@scala/scala-rpc').RPCDaemon

const daemonClient = rpcDaemon.createDaemonClient({
  url: 'http://127.0.0.1:39994',
  username: 'user',
  password: 'pass'
})
// When using a self signed certificate with HTTPS you need to set the function sslRejectUnauthorized to false.
daemonClient.sslRejectUnauthorized(false)
```


## RPCWallet without Digest Authentication
Please refer to the [documentation](https://scala.github.io/scala-rpc-js/module-RPCWallet.html) and look at the unit tests.
```javascript
const rpcWallet = require('@scala/scala-rpc').RPCWallet

const walletClient = rpcWallet.createWalletClient({
  url: 'http://127.0.0.1:20000'
})
// When using a self signed certificate with HTTPS you need to set the function sslRejectUnauthorized to false.
walletClient.sslRejectUnauthorized(false)
```


## RPCWallet with Digest Authentication
Please refer to the [documentation](https://scala.github.io/scala-rpc-js/module-RPCWallet.html) and look at the unit tests.
```javascript
  const rpcWallet = require('@scala/scala-rpc').RPCWallet

  const walletClient = rpcWallet.createWalletClient({
  url: 'http://127.0.0.1:20000',
  username: 'user',
  password: 'pass'
})
// When using a self signed certificate with HTTPS you need to set the function sslRejectUnauthorized to false.
walletClient.sslRejectUnauthorized(false)
```

## Generate JSDoc documentation
```
npm run generate-docs
```

## Get unit tests list
```
npm test
```
