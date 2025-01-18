'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const rpcDaemon = require('../../lib/rpcDaemon.js')

const config = require('./config')

describe('RPCDaemon tests functions', function () {
  const daemonClient = rpcDaemon.createDaemonClient({
    url: config.daemonAddress,
    username: config.daemonUsername,
    password: config.daemonPassword
  })

  daemonClient.sslRejectUnauthorized(false)

  it('flushTxPool should return OK', () => {
    return expect(daemonClient.flushTxPool({ txids: ['cca25843d040eae32be1e1eb4fbac3bab9c8a2634e46ba22bdcb609c41f77ff2'] }))
      .to.eventually.have.property('status', 'OK')
  })
  it('getAlternateChains should return OK', () => {
    return expect(daemonClient.getAlternateChains())
      .to.eventually.have.property('status', 'OK')
  })
  it('setBans with parameter should return OK', () => {
    const opts = {
      bans: [{ host: '192.168.1.51', ban: true, seconds: 30 }, { ip: 838969536, ban: true, seconds: 30 }]
    }
    return expect(daemonClient.setBans(opts))
      .to.eventually.have.property('status', 'OK')
  })
  it('getBans with parameter should return banned hosts and ips', () => {
    return expect(daemonClient.getBans())
      .to.eventually.have.property('bans')
      .to.have.deep.members([{ host: '192.168.1.50', ip: 838969536, seconds: 30 },
        { host: '192.168.1.51', ip: 855746752, seconds: 30 }])
  })
  it('getBlock with hash should return a block', () => {
    const opts = {
      hash: config.blockHash
    }
    return expect(daemonClient.getBlock(opts))
      .to.eventually.have.property('block_header')
      .to.eventually.have.property('height', config.blockHeight)
  })
  it('getBlock with height should return a block', () => {
    const opts = {
      height: config.blockHeight
    }
    return expect(daemonClient.getBlock(opts))
      .to.eventually.have.property('block_header')
      .to.eventually.have.property('hash', config.blockHash)
  })
  it('getBlockCount should return a count gt 0', () => {
    return expect(daemonClient.getBlockCount())
      .to.eventually.have.property('count')
      .to.eventually.be.gt(0)
  })
  it('getBlockHash with height should return a matching hash', () => {
    const opts = {
      height: config.blockHeight
    }
    return expect(daemonClient.getBlockHash(opts))
      .to.eventually.equal(config.blockHash)
  })
  it('getBlockHeaderByHash with hash should return a block header with a matching height', () => {
    const opts = {
      hash: config.blockHash
    }
    return expect(daemonClient.getBlockHeaderByHash(opts))
      .to.eventually.have.property('block_header')
      .to.eventually.have.property('height', config.blockHeight)
  })
  it('getBlockHeaderByHeight with height should return a block header with a matching hash', () => {
    const opts = {
      height: config.blockHeight
    }
    return expect(daemonClient.getBlockHeaderByHeight(opts))
      .to.eventually.have.property('block_header')
      .to.eventually.have.property('hash', config.blockHash)
  })
  it('getBlockHeadersRange with heights should return block headers', () => {
    const opts = {
      start_height: config.blockHeight,
      end_height: config.blockHeight + 1
    }
    return expect(daemonClient.getBlockHeadersRange(opts))
      .to.eventually.have.property('headers')
  })
  it('getBlockTemplate should return status OK', async () => {
    const opts = {
      wallet_address: config.walletAddress,
      reserve_size: 0
    }

    return expect(daemonClient.getBlockTemplate(opts))
      .to.eventually.have.property('status').that.is.oneOf(['OK', 'BUSY'])
  })
  it('getCoinbaseTxSum should return status OK', () => {
    return expect(daemonClient.getCoinbaseTxSum({ height: 1, count: 100 }))
      .to.eventually.have.property('status', 'OK')
  })
  it('getConnections should retrieve information about connections', () => {
    return expect(daemonClient.getConnections())
      .to.eventually.have.property('status', 'OK')
  })
  it('getFeeEstimate should return OK', async () => {
    return expect(daemonClient.getFeeEstimate())
      .to.eventually.have.property('status', 'OK')
  })
  it('getHardForkInfo should retrieve general informations', () => {
    return expect(daemonClient.getHardForkInfo())
      .to.eventually.have.property('status', 'OK')
  })
  it('getInfo should retrieve general informations', () => {
    return expect(daemonClient.getInfo())
      .to.eventually.have.property('block_size_limit')
  })
  it('getLastBlockHeader should return a block header', () => {
    return expect(daemonClient.getLastBlockHeader())
      .to.eventually.have.property('block_header')
  })
  it('getOutputDistribution should return OK', () => {
    const opts = {
      amounts: [100000],
      cumulative: true,
      from_height: 1,
      to_height: 100
    }
    return expect(daemonClient.getOutputDistribution(opts))
      .to.eventually.have.property('status', 'OK')
  })
  it('getOutputHistogram should return status OK', () => {
    const opts = {
      amounts: [100000],
      min_count: 1,
      max_count: 100,
      unlocked: true,
      recent_cutoff: 100
    }
    return expect(daemonClient.getOutputHistogram(opts))
      .to.eventually.have.property('status', 'OK')
  })
  it('getVersion should return OK', () => {
    return expect(daemonClient.getVersion())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherGetAltBlocksHashes should return OK', () => {
    return expect(daemonClient.otherGetAltBlocksHashes())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherGetHeight should return OK', () => {
    return expect(daemonClient.otherGetHeight())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherSetLimit should return OK', () => {
    const opts = {
      limit_up: 4096,
      limit_down: 8192
    }
    return expect(daemonClient.otherSetLimit(opts))
      .to.eventually.have.property('status', 'OK')
  })
  it('otherGetLimit should return correct limit_down', () => {
    return expect(daemonClient.otherGetLimit())
      .to.eventually.have.property('limit_down', 8192)
  })
  it('otherGetPeerList status should return OK', () => {
    return expect(daemonClient.otherGetPeerList())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherGetTransactionPool should return OK', () => {
    return expect(daemonClient.otherGetTransactionPool())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherGetTransactionPoolStats should return OK', () => {
    return expect(daemonClient.otherGetTransactionPoolStats())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherGetTransactions should return the whole transaction', async () => {
    const opts = {
      txs_hashes: [config.txids[0]],
      decode_as_json: true,
      prune: true
    }

    return expect(daemonClient.otherGetTransactions(opts))
      .to.eventually.have.nested.property('txs[0].block_height', 20000)
  })
  it('otherIsKeyImageSpent should return 0', () => {
    const opts = {
      key_images: [config.spent_key]
    }
    return expect(daemonClient.otherIsKeyImageSpent(opts))
      .to.eventually.have.nested.property('spent_status[0]', 0)
  })
  it('otherOutPeers should return OK', () => {
    const opts = {
      out_peers: 3232235535
    }
    return expect(daemonClient.otherOutPeers(opts))
      .to.eventually.have.property('status', 'OK')
  })
  it('otherInPeers should return OK', () => {
    const opts = {
      in_peers: 3232235535
    }
    return expect(daemonClient.otherInPeers(opts))
      .to.eventually.have.property('status', 'OK')
  })
  it('otherSaveBc blockchain status should return OK', () => {
    return expect(daemonClient.otherSaveBc())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherSendRawTransaction with tx_as_hex should return OK', () => {
    let opts = {
      txs_hashes: [config.txids[0]]
    }
    return daemonClient.otherGetTransactions(opts).then( (result) => {
      const txHex = result.txs_as_hex['0']
      opts = {
        tx_as_hex: txHex,
        do_not_relay: false
      }

      return expect(daemonClient.otherSendRawTransaction(opts))
      .to.eventually.have.property('status')
      .that.is.oneOf(['OK', 'BUSY', 'Failed']);    
    })
  })
  it('otherSetLogCategories without parameter status should return OK', () => {
    return expect(daemonClient.otherSetLogCategories())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherSetLogCategories with parameter should return parameter value', () => {
    const opts = {
      categories: '*:INFO'
    }
    return expect(daemonClient.otherSetLogCategories(opts))
      .to.eventually.have.property('categories', '*:INFO')
  })
  it('otherSetLogHashrate when not mining should be rejected', () => {
    const opts = {
      visible: true
    }
    return expect(daemonClient.otherSetLogHashrate(opts))
      .to.eventually.be.rejected
      .and.be.an.instanceOf(Error, 'NOT MINING')
  })
  it('otherSetLogLevel status should return OK', () => {
    const opts = {
      level: 1
    }
    return expect(daemonClient.otherSetLogLevel(opts))
      .to.eventually.have.property('status', 'OK')
  })
  it('otherStartMining should return OK', () => {
    const opts = {
      do_background_mining: true,
      ignore_battery: true,
      miner_address: config.walletAddress,
      threads_count: 1
    }
    return expect(daemonClient.otherStartMining(opts))
      .to.eventually.have.property('status').that.is.oneOf(['OK', 'BUSY']);
  })
  it('otherMiningStatus should return OK', () => {
    return expect(daemonClient.otherMiningStatus())
      .to.eventually.have.property('status', 'OK')
  })
  it('otherStopMining should return OK', () => {
    return expect(daemonClient.otherStopMining())
      .to.eventually.have.property('status', 'OK')
  })
  it('relayTx should be rejected', () => {
    const opts = {
      txids: config.txids
    }

    return expect(daemonClient.relayTx(opts))
      .to.eventually.be.rejected
      .and.be.an.instanceOf(Error)
      .and.have.property('code', -5)
  })
  it('submitBlock with a blob should be rejected', () => {
    const opts = {
      blobs: ['0707e6bdfedc053771512f1bc27c62731ae9e8f2443db64ce742f4e57f5cf8d393de28551e441a0000000002fb830a01ffbf830a018cfe88bee283060274c0aae2ef5730e680308d9c00b6da59187ad0352efe3c71d36eeeb28782f29f2501bd56b952c3ddc3e350c2631d3a5086cac172c56893831228b17de296ff4669de020200000000']
    }
    return expect(daemonClient.submitBlock(opts))
      .to.eventually.be.rejected
      .and.be.an.instanceOf(Error)
      .and.have.property('code', -7)
  })
  it('syncInfo should return OK', () => {
    return expect(daemonClient.syncInfo())
      .to.eventually.have.property('status', 'OK')
  })
  // it('otherStopDaemon should return OK', () => {
  //   return expect(daemonClient.otherStopDaemon())
  //     .to.eventually.have.property('status', 'OK')
  // })
})
