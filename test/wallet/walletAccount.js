'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const before = require('mocha').before
const after = require('mocha').after
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const rpcWallet = require('../../lib/rpcWallet.js')

const config = require('./config')

describe('RPCWallet wallet account functions', function () {
  const walletClient = rpcWallet.createWalletClient({
    url: config.walletAddress,
    username: config.walletUsername,
    password: config.walletPassword
  })
  
  walletClient.sslRejectUnauthorized(false)

  before(async function () {
    try {
      await walletClient.restoreDeterministicWallet({ restore_height: config.restore_height, filename: 'account', seed: config.seedA })
      await walletClient.refresh()
    } catch (e) {
      console.log('Error in before', e)
    }
  })

  after(async function () {
    try {
      await walletClient.closeWallet()
    } catch (e) {
      console.log('Error in after', e)
    }
  })

  it('addAddressBook', () => {
    return expect(walletClient.addAddressBook({ address: config.walletB, payment_id: config.payment_id, description: 'AddressB' }))
      .to.eventually.have.property('index', 0)
  })
  it('getAddressBook', () => {
    return expect(walletClient.getAddressBook({ entries: [0] }))
      .to.eventually.have.nested.property('entries[0].address', config.walletB)
  })
  it('deleteAddressBook', () => {
    return expect(walletClient.deleteAddressBook({ index: 0 }))
      .to.eventually.be.an('object').that.is.empty
  })
  it('createAccount with label "account one"', () => {
    return expect(walletClient.createAccount({ label: 'account one' }))
      .to.eventually.have.property('account_index', 1)
  })
  it('createAccount with label "account two"', () => {
    return expect(walletClient.createAccount({ label: 'account two' }))
      .to.eventually.have.property('account_index', 2)
  })
  it('getAccounts and check label of "account two"', () => {
    return expect(walletClient.getAccounts())
      .to.eventually.have.nested.property('subaddress_accounts[2].label', 'account two')
  })
  it('createAddress on "second account"', () => {
    return expect(walletClient.createAddress({ account_index: 2, label: 'sub two' }))
      .to.eventually.have.property('address_index', 1)
  })
  it('getAddress and check label of "sub two"', () => {
    return expect(walletClient.getAddress({ account_index: 2 }))
      .to.eventually.have.nested.property('addresses[1].label', 'sub two')
  })
  it('tagAccount with "created account"', () => {
    return expect(walletClient.tagAccounts({ tag: 'created accounts', accounts: [1, 2] }))
      .to.eventually.be.an('object').that.is.empty
  })
  it('setAccountTagDescription with "blablabla"', () => {
    return expect(walletClient.setAccountTagDescription({ tag: 'created accounts', description: 'blablabla' }))
      .to.eventually.be.an('object').that.is.empty
  })
  it('getAccountTags and check label of "created accounts"', () => {
    return expect(walletClient.getAccountTags())
      .to.eventually.have.nested.property('account_tags[0].label', 'blablabla')
  })
  it('untagAccounts "created account"', () => {
    return expect(walletClient.untagAccounts({ accounts: [1, 2] }))
      .to.eventually.be.an('object').that.is.empty
  })
  it('getAddressIndex', () => {
    return expect(walletClient.getAddressIndex({ address: config.walletA }))
      .to.eventually.have.property('index')
      .to.eventually.have.property('major', 0)
  })
  it('setAttribute', () => {
    return expect(walletClient.setAttribute({ key: 'test', value: 'lalala' }))
      .to.eventually.be.an('object').that.is.empty
  })
  it('getAttribute', () => {
    return expect(walletClient.getAttribute({ key: 'test' }))
      .to.eventually.have.property('value', 'lalala')
  })
  it('getBulkPayments', () => {
    return expect(walletClient.getBulkPayments({ payment_ids: [config.payment_id], min_block_height: 1 }))
    .to.eventually.satisfy((result) => {
      return (
        Object.keys(result).length === 0 || 
        result.payments?.[0]?.address !== undefined
      );
    });
  })
  it('getHeight', () => {
    return expect(walletClient.getHeight())
      .to.eventually.have.property('height')
  })
  it('getTransfers', () => {
    const opts = {
      in: true,
      out: true,
      pending: true,
      failed: true,
      pool: true,
      filter_by_height: true,
      min_height: 1,
      max_height: 20000,
      account_index: 0,
      subaddr_indices: [0]
    };
  
    return expect(walletClient.getTransfers(opts))
      .to.eventually.be.an('object');
  });  
  it('getVersion', () => {
    return expect(walletClient.getVersion())
      .to.eventually.have.property('release')
  })
  it('labelAccount "account two" with "second account"', () => {
    return expect(walletClient.labelAccount({ account_index: 2, label: 'second account' }))
      .to.eventually.be.an('object').that.is.empty
  })
  it('getAccounts and check label of "second account"', () => {
    return expect(walletClient.getAccounts())
      .to.eventually.have.nested.property('subaddress_accounts[2].label', 'second account')
  })
  it('labelAddress "sub two" with "second sub"', () => {
    return expect(walletClient.labelAddress({ index: { major: 2, minor: 1 }, label: 'second sub' }))
      .to.eventually.be.an('object').that.is.empty
  })
  it('getAddress and check label of "second sub"', () => {
    return expect(walletClient.getAddress({ account_index: 2 }))
      .to.eventually.have.nested.property('addresses[1].label', 'second sub')
  })
  it('makeIntegratedAddress', () => {
    return walletClient.makeIntegratedAddress({ address: config.walletA, payment_id: config.payment_id })
      .then(result => {
        expect(result).to.have.property('integrated_address');
        expect(result.integrated_address.startsWith('Si')).to.be.true;
      });
  });  
  it('splitIntegratedAddress', () => {
    return expect(walletClient.splitIntegratedAddress({ integrated_address: config.integratedAddressA }))
      .to.eventually.have.property('payment_id', config.payment_id)
  })
  it('queryKey', () => {
    return expect(walletClient.queryKey({ key_type: 'mnemonic' }))
      .to.eventually.have.property('key', config.seedA)
  })
  it('sign string', () => {
    return expect(walletClient.sign({ data: config.dataToSign }))
      .to.eventually.have.property('signature')
  })
  it('verify string', () => {
    return expect(walletClient.verify({ data: config.dataToSign, address: config.walletA, signature: config.signedData }))
      .to.eventually.have.property('good', false)
  })
})
