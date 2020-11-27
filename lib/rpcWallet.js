'use strict'

const http = require('./httpClient')
const { default: PQueue } = require('p-queue')
const rpcHelpers = require('./rpcHelpers')

function parseWalletResponse (res) {
  if (res.status === 200) {
    if ('result' in res.data) {
      return res.data.result
    } else {
      const error = new Error('RPC Error!')
      error.code = res.data.error.code
      error.message = res.data.error.message
      throw error
    }
  } else {
    const error = new Error('HTTP Error!')
    error.code = res.status
    error.message = res.data
    throw error
  }
}
/**
 * @module RPCWallet
 */
var rpcWallet = {}

/**
* Factory that creates a RPCWallet client object.
* @function module:RPCWallet.createWalletClient
* @param {Object} opts
* @param {string} opts.url - complete url with port 'http://127.0.0.1:20000' or 'https://127.0.0.1:20000'.
* @param {string} [opts.username='Mufasa'] - username.
* @param {string} [opts.password='Circle of Life'] - password.
* @return {RPCWallet} returns a new instance of RPCDaemon.
*/
rpcWallet.createWalletClient = function (config) {
  const queue = new PQueue({ concurrency: 1 })
  const httpClient = http.createHttpClient(config)
  const jsonAddress = config.url + '/json_rpc'

  httpClient.defaults.headers.post['Content-Type'] = 'application/json'

  return {
    /**
    *  Convenience Digest function to reset nc to '00000001' and generate a new cnonce
    */
    resetNonces: async function () {
      return httpClient.resetNonces()
    },
    /**
    *  If not false, the server certificate is verified against the list of supplied CAs.
    */
    sslRejectUnauthorized: function (value) {
      httpClient.defaults.httpAgent.options.rejectUnauthorized = value
      httpClient.defaults.httpsAgent.options.rejectUnauthorized = value
      return value
    },
    /**
    * Retrieves entries from the address book.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - Address.
    * @param {string} [opts.payment_id] - Defaults to "0000000000000000000000000000000000000000000000000000000000000000".
    * @param {string} [opts.description] - Defaults to "".
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  index: 0
    * }
    */
    addAddressBook: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ address: 'Address' }, opts)

      rpcHelpers.checkOptionalParametersType({
        payment_id: 'PaymentId',
        description: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'add_address_book', opts)
    },
    /**
    * Refresh wallet on interval.
    * @async
    * @param {Object} opts
    * @param {boolean} opts.enable - True to enable. False to deactivate.
    * @param {number} [opts.period] - Interval in seconds. Default is 20.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    autoRefresh: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ enable: 'Boolean' }, opts)

      rpcHelpers.checkOptionalParametersType({ period: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'auto_refresh', opts)
    },
    /**
    * Change a wallet password.
    * @async
    * @param {Object} [opts]
    * @param {string} [opts.old_password] - Current wallet password, if defined.
    * @param {string} [opts.new_password] - New wallet password, if not blank.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    changeWalletPassword: async function (opts) {
      rpcHelpers.checkOptionalParametersType({
        old_password: 'String',
        new_password: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'change_wallet_password', opts)
    },
    /**
    * Proves a wallet has a disposable reserve using a signature.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - Public address of the wallet.
    * @param {string} [opts.message] - Should be the same message used in get_reserve_proof.
    * @param {string} opts.signature - Reserve signature to confirm.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  good: true,
    *  spent: 0,
    *  total: 6000000000
    * }
    */
    checkReserveProof: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        address: 'Address',
        signature: 'String'
      }, opts)

      rpcHelpers.checkOptionalParametersType({ message: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'check_reserve_proof', opts)
    },
    /**
    * Prove a spend using a signature. Unlike proving a transaction, it does not requires the destination public address.
    * @async
    * @param {Object} opts
    * @param {string} opts.txid - Transaction id.
    * @param {string} [opts.message] - Should be the same message used in get_tx_proof.
    * @param {string} opts.signature - Transaction signature to confirm.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { good: true }
    */
    checkSpendProof: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        txid: 'Hash',
        signature: 'String'
      }, opts)

      rpcHelpers.checkOptionalParametersType({ message: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'check_spend_proof', opts)
    },
    /**
    * Check a transaction in the blockchain with its secret key.
    * @async
    * @param {Object} opts
    * @param {string} opts.txid - Transaction id.
    * @param {string} opts.tx_key - Transaction secret key.
    * @param {string} opts.address - Destination public address of the transaction.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  confirmations: 18446744073709552000,
    *  in_pool: true,
    *  received: 0
    * }
    */
    checkTxKey: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        txid: 'Hash',
        tx_key: 'Hash',
        address: 'Address'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'check_tx_key', opts)
    },
    /**
    * Prove a transaction by checking its signature.
    * @async
    * @param {Object} opts
    * @param {string} opts.txid - Transaction id.
    * @param {string} opts.address - Destination public address of the transaction.
    * @param {string} [opts.message] - Should be the same message used in get_tx_proof.
    * @param {string} opts.signature - Transaction signature to confirm.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  confirmations: 1502,
    *  good: true,
    *  in_pool: false,
    *  received: 12000000000
    * }
    */
    checkTxProof: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        txid: 'Hash',
        address: 'Address',
        signature: 'String'
      }, opts)

      rpcHelpers.checkOptionalParametersType({ message: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'check_tx_proof', opts)
    },
    /**
    * Close the currently opened wallet, after trying to save it.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    closeWallet: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'close_wallet')
    },
    /**
    * Create a new account with an optional label.
    * @async
    * @param {Object} opts
    * @param {string} [opts.label] - Label for the account.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  account_index: 1,
    *  address: 'aRS3fTmhpE7JWf1cv4q9LWWEfWMGSEXHYPeMYHxHkupUHrequ4CNs5mCq248sLPmQVBz96yUdVhivNXq5hQr6C4s7sNcWH4LHh'
    * }
    */
    createAccount: async function (opts) {
      rpcHelpers.checkOptionalParametersType({ label: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'create_account', opts)
    },
    /**
    * Create a new address for an account. Optionally, label the new address.
    * @async
    * @param {Object} opts
    * @param {number} opts.account_index - Create a new address for this account.
    * @param {string} [opts.label] - Label for the new address.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  address: 'aRS3Pz1Zc2nNEo3K3wcZCWWRQWvVrom7B72XdoZem22wUHtFhyqSMJnAUtGBd2coHZGyqwrzWrXud4q2B6T4rGic3gDgVGoau7',
    *  address_index: 1
    * }
    */
    createAddress: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ account_index: 'Integer' }, opts)

      rpcHelpers.checkOptionalParametersType({ label: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'create_address', opts)
    },
    /**
    * Create a new wallet. You need to have set the argument "–wallet-dir" when launching scala-wallet-rpc to make this work.
    * @async
    * @param {Object} opts
    * @param {string} opts.filename - Wallet file name.
    * @param {string} [opts.password] - password to protect the wallet.
    * @param {string} opts.language - Language for your wallets' seed.
    * @returns {Promise} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    createWallet: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        filename: 'String',
        language: 'String'
      }, opts)

      rpcHelpers.checkOptionalParametersType({ password: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'create_wallet', opts)
    },
    /**
    * Delete an entry from the address book.
    * @async
    * @param {Object} opts
    * @param {number} opts.index - The index of the address book entry.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    deleteAddressBook: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ index: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'delete_address_book', opts)
    },
    /**
    * Export a signed set of key images.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  signed_key_images:
    *  [
    *   { key_image: '264d2998d74a60292322f8a1ec4b317bd8e4c16147385cca92aef734bda2e5f7',
    *     signature: '97bc571ce5634117fd96a5fab65bd1817dd35176e11125b752014d9039478f0c4386000f2719c338a8e7db02b6af6a81ccd346fbb3284f5a495e93510272ac09'
    *   },
    *   ...
    *  ]
    * }
    */
    exportKeyImages: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'export_key_images')
    },
    /**
    * Export multisig info for other participants.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { info: '4172516d41206d756c7469736967206578706f72740130d905ab541a07f7b0ace79b045361535cd857210c96dd09c8fc1c5b0ef3735e60418f042f5e870b77e0143f7851983022138ba2b0951352850ab8165fd97a7314428ec0d5320cc02f139b5282f039eb677eaf8045d1e91d835e1240842deef73dd77d76dee2334d19dfa7b9bb7093345b013ce5a31bfc797f22435e1b71d90d06d2cece32f45bc67c5abc64e43de9e37555933f8e17044ead5a837fdd6be88cc89527194bb901c797c9911d0fd993f504d7d78718acb521d2911b39e1a3b00968f403c2c8240b' }
    */
    exportMultisigInfo: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'export_multisig_info')
    },
    /**
    * Export all outputs in hex format.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  outputs_data_hex: '4172516d41206f ...f'
    * }
    */
    exportOutputs: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'export_outputs')
    },
    /**
    * Turn this wallet into a multisig wallet, extra step for N-1/N wallets.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.multisig_info - List of multisig string from peers.
    * @param {string} opts.password - Wallet password.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * To be completed
    */
    finalizeMultisig: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        multisig_info: 'ArrayOfStrings',
        password: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'finalize_multisig', opts)
    },
    /**
    * Restore wallet using mnemonic seed.
    * @async
    * @param {Object} opts
    * @param {number} [opts.restore_height] - Start height for scanning the blockchain.
    * @param {string} opts.filename - Wallet filename.
    * @param {string} opts.address - Wallet address.
    * @param {string} [opts.spendkey] - Wallet spend key.
    * @param {string} opts.viewkey - Wallet view key.
    * @param {string} [opts.password] - Wallet password.
    * @param {boolean} [opts.autosave_current] - Save wallet.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  address: 'ar47HiRLKrEcQdgRhN2FTfEnJwkXoUWKH8WAwTucZ8RP9QxB2WMhh6Ffzhfh2panETahxdMX7cjhaiV6ShvG5gdY2iALecvcL',
    *  info: 'Wallet has been restored successfully.',
    *  seed: 'pulp peeled picked succeed wildly lymph edgy sushi limits hitched balding rising syndrome omission getting unafraid feline hornet darted mixture napkin remedy uptight wield unafraid',
    *  was_deprecated: false
    * }
    */
    generateFromKeys: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        filename: 'String',
        address: 'Address',
        viewkey: 'Hash'
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        restore_height: 'Integer',
        spendkey: 'Hash',
        password: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'generate_from_keys', opts)
    },
    /**
    * Get all accounts for a wallet. Optionally filter accounts by tag.
    * @async
    * @param {Object} [opts]
    * @param {string} [opts.tag] - Tag for filtering accounts.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  subaddress_accounts:
    *  [
    *   {
    *    account_index: 0,
    *    balance: 0,
    *    base_address: 'ar2ucUkifo5g39rBYsGk4KKkCySVhQcZtd8iazcvnrH8jVFTEZBnQYifVDj89prrYMeBah6BRm6HtN7n5aKuZwd72yZvbzmNL',
    *    label: 'Primary account',
    *    tag: '',
    *    unlocked_balance: 0
    *   }
    *  ],
    *  total_balance: 0,
    *  total_unlocked_balance: 0
    * }
    */
    getAccounts: async function (opts) {
      rpcHelpers.checkOptionalParametersType({ tag: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_accounts', opts)
    },
    /**
    * Get a list of user-defined account tags.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  account_tags:
    *  [
    *   { accounts: [Array], label: '', tag: 'created accounts' }
    *  ]
    * }
    */
    getAccountTags: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_account_tags')
    },
    /**
    * Return the wallet's addresses for an account. Optionally filter for specific set of subaddresses.
    * @async
    * @param {Object} opts
    * @param {number} opts.account_index - Return subaddresses for this account.
    * @param {number[]} [opts.address_index] - List of subaddresses to return from an account.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  address: 'ar2ucUkifo5g39rBYsGk4KKkCySVhQcZtd8iazcvnrH8jVFTEZBnQYifVDj89prrYMeBah6BRm6HtN7n5aKuZwd72yZvbzmNL',
    *  addresses:
    *  [
    *   {
    *    address: 'ar2ucUkifo5g39rBYsGk4KKkCySVhQcZtd8iazcvnrH8jVFTEZBnQYifVDj89prrYMeBah6BRm6HtN7n5aKuZwd72yZvbzmNL',
    *    address_index: 0,
    *    label: 'Primary account',
    *    used: false
    *   }
    *  ]
    * }
    */
    getAddress: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ account_index: 'Integer' }, opts)

      rpcHelpers.checkOptionalParametersType({ address_index: 'ArrayOfIntegers' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_address', opts)
    },
    /**
    * Retrieves entries from the address book.
    * @async
    * @param {Object} opts
    * @param {number[]} opts.entries - Indices of the requested address book entries.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  entries:
    *   [
    *    {
    *     address: 'ar3oJsuAn3f31weg11zx27AoReEBPRtv5XRLtoYJRGVcQFNuXJcPtftBvcZz4YW7Fj4c4iV9G81299rz1ZB72kie2M3afy6ho',
    *     description: 'test',
    *     index: 0,
    *     payment_id: '0000000000000000000000000000000000000000000000000000000000000000'
    *    }
    *  ]
    * }
    */
    getAddressBook: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ entries: 'ArrayOfIntegers' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_address_book', opts)
    },
    /**
    * Get account and address indexes from a specific (sub)address.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - (sub)address to look for.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  index:
    *  {
    *   major: 0,
    *   minor: 0
    *  }
    * }
    */
    getAddressIndex: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ address: 'Address' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_address_index', opts)
    },
    /**
    * Get arbitrary attribute.
    * @async
    * @param {Object} opts
    * @param {string} opts.key - Attribute name.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  value": 'my_value'
    * }
    */
    getAttribute: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ key: 'String' }, opts)
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_attribute', opts)
    },
    /**
    * Return the wallet's balance.
    * @async
    * @param {Object} opts
    * @param {number} opts.account_index - Return balance for this account.
    * @param {number[]} [opts.address_indices] - Return balance detail for those subaddresses.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  balance: 0,
    *  multisig_import_needed: false,
    *  unlocked_balance: 0
    * }
    */
    getBalance: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ account_index: 'Integer' }, opts)

      rpcHelpers.checkOptionalParametersType({ address_index: 'ArrayOfIntegers' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_balance', opts)
    },
    /**
    * Get a list of incoming payments using a given payment id, or a list of payments ids, from a given height. This method is the preferred method over get_payments because it has the same functionality but is more extendable. Either is fine for looking up transactions by a single payment ID.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.payment_ids - Payment IDs used to find the payments (16 characters hex).
    * @param {number} opts.min_block_height - The block height at which to start looking for payments.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  payments:
    *  [
    *   {
    *    address: 'as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2',
    *    amount: 1100000000,
    *    block_height: 8667,
    *    payment_id: '8ca523f5e9506fed',
    *    subaddr_index: [Object],
    *    tx_hash: '577d8d53135d49b46238c37fe2429e38610b0fcc4f06799969a7b60c69388d53',
    *    unlock_time: 0
    *   },
    *   ...
    *  ]
    * }
    */
    getBulkPayments: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        payment_ids: 'ArrayOfPaymentIds',
        min_block_height: 'Integer'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_bulk_payments', opts)
    },
    /**
    * Returns the wallet's current block height.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  height: 149880
    * }
    */
    getHeight: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_height')
    },
    /**
    * Get a list of available languages for your wallet's seed.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  languages:
    *  [
    *   'Deutsch',
    *   'English',
    *   'Español',
    *   'Français',
    *   'Italiano',
    *   'Nederlands',
    *   'Português',
    *   'русский язык',
    *   '日本語',
    *   '简体中文 (中国)',
    *   'Esperanto',
    *   'Lojban'
    *  ]
    * }
    */
    getLanguages: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_languages')
    },
    /**
    * Get a list of incoming payments using a given payment id.
    * @async
    * @param {Object} opts
    * @param {string} opts.payment_id - Payment ID used to find the payments (16 characters hex).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  payments:
    *  [
    *   {
    *    address: 'as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2',
    *    amount: 1100000000,
    *    block_height: 8667,
    *    payment_id: '8ca523f5e9506fed',
    *    subaddr_index: [Object],
    *    tx_hash: '577d8d53135d49b46238c37fe2429e38610b0fcc4f06799969a7b60c69388d53',
    *    unlock_time: 0
    *   },
    *   ...
    *  ]
    * }
    */
    getPayments: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ payment_id: 'PaymentId' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_payments', opts)
    },
    /**
    * Generate a signature to prove of an available amount in a wallet.
    * @async
    * @param {Object} opts
    * @param {boolean} opts.all - Proves all wallet balance to be disposable.
    * @param {number} opts.account_index - Specify the account from witch to prove reserve. (ignored if all is set to true).
    * @param {number} opts.amount - Amount (in atomic units) to prove the account has for reserve. (ignored if all is set to true).
    * @param {string} [opts.message] - Should be the same message used in get_tx_proof.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { signature: 'ReserveProofV11BZ2 ...' }
    */
    getReserveProof: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        all: 'Boolean',
        account_index: 'Integer',
        amount: 'Integer'
      }, opts)
      rpcHelpers.checkOptionalParametersType({ message: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_reserve_proof', opts)
    },
    /**
    * Generate a signature to prove a spend. Unlike proving a transaction, it does not requires the destination public address.
    * @async
    * @param {Object} opts
    * @param {string} opts.txid - Transaction id.
    * @param {string} [opts.message] - Add a message to the signature to further authenticate the prooving process.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { signature: 'SpendProofV1TsQK...' }
    */
    getSpendProof: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ txid: 'Hash' }, opts)

      rpcHelpers.checkOptionalParametersType({ message: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_spend_proof', opts)
    },
    /**
    * Show information about a transfer to/from this address.
    * @async
    * @param {Object} opts
    * @param {string} opts.txid - Transaction ID used to find the transfer.
    * @param {string} [opts.account_index] - Index of the account to query for the transfer.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  transfer:
    *  {
    *   address: 'as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2',
    *   amount: 12000000000,
    *   confirmations: 918,
    *   double_spend_seen: false,
    *   fee: 24240,
    *   height: 7924,
    *   note: '',
    *   payment_id: '8ca523f5e9506fed',
    *   subaddr_index: { major: 0, minor: 0 },
    *   suggested_confirmations_threshold: 1,
    *   timestamp: 1558474233,
    *   txid: 'cf51c2ce7c0197a7cc813b264d6289095170b06c0ef2540ad8f22f36cd656869',
    *   type: 'in',
    *   unlock_time: 0
    *  },
    *  transfers:
    *  [
    *   {
    *    address: 'as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2',
    *    amount: 12000000000,
    *    confirmations: 918,
    *    double_spend_seen: false,
    *    fee: 24240,
    *    height: 7924,
    *    note: '',
    *    payment_id: '8ca523f5e9506fed',
    *    subaddr_index: [Object],
    *    suggested_confirmations_threshold: 1,
    *    timestamp: 1558474233,
    *    txid: 'cf51c2ce7c0197a7cc813b264d6289095170b06c0ef2540ad8f22f36cd656869',
    *    type: 'in',
    *    unlock_time: 0
    *   }
    *  ]
    * }
    */
    getTransferByTxId: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ txid: 'Hash' }, opts)

      rpcHelpers.checkOptionalParametersType({ account_index: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_transfer_by_txid', opts)
    },
    /**
    * Returns a list of transfers.
    * @async
    * @param {Object} [opts]
    * @param {boolean} [opts.in] - Include incoming transfers.
    * @param {boolean} [opts.out] - Include outgoing transfers.
    * @param {boolean} [opts.pending] - Include pending transfers.
    * @param {boolean} [opts.failed] - Include failed transfers.
    * @param {boolean} [opts.pool] - Include transfers from the daemon's transaction pool.
    * @param {boolean} [opts.filter_by_height] - Filter transfers by block height.
    * @param {boolean} [opts.min_height] - Minimum block height to scan for transfers, if filtering by height is enabled.
    * @param {boolean} [opts.max_height] - Maximum block height to scan for transfers, if filtering by height is enabled.
    * @param {number} [opts.account_index] - Index of the account to query for transfers. (defaults to 0).
    * @param {number[]} [opts.subaddr_indices] - List of subaddress indices to query for transfers. (defaults to 0).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  in:
    *  [
    *   { address: 'as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2',
    *     amount: 303838957143,
    *     confirmations: 960,
    *     double_spend_seen: false,
    *     fee: 105040,
    *     height: 7878,
    *     note: '',
    *     payment_id: '0000000000000000',
    *     subaddr_index: [Object],
    *     suggested_confirmations_threshold: 16,
    *     timestamp: 1558406226,
    *     txid: '666d97c738679527d0943e2c03bcfec5889b488ad4b84cb6f0b40d8f0970bc4a',
    *     type: 'in',
    *     unlock_time: 0
    *    },
    *    ...
    *  ]
    * }
    */
    getTransfers: async function (opts) {
      rpcHelpers.checkOptionalParametersType({
        in: 'Boolean',
        out: 'Boolean',
        pending: 'Boolean',
        failed: 'Boolean',
        pool: 'Boolean',
        filter_by_height: 'Boolean',
        min_height: 'Integer',
        max_height: 'Integer',
        account_index: 'Integer',
        subaddr_indices: 'ArrayOfIntegers'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_transfers', opts)
    },
    /**
    * Get transaction secret key from transaction id.
    * @async
    * @param {Object} opts
    * @param {string} opts.txid - Transaction id.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  tx_key: '1f2e9895ff77c15eb11ad971b668c353943aa5f0f7a328cd01f9ff5d47b43d09'
    * }
    */
    getTxKey: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ txid: 'Hash' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_tx_key', opts)
    },
    /**
    * Get string notes for transactions.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.txids - Transaction ids.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  notes: [ 'coffee', 'bread' ]
    * }
    */
    getTxNotes: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ txids: 'ArrayOfHashes' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_tx_notes', opts)
    },
    /**
    * Get transaction signature to prove it.
    * @async
    * @param {Object} opts
    * @param {string} opts.txid - Transaction id.
    * @param {string} opts.address - Destination public address of the transaction.
    * @param {string} [opts.message] - Add a message to the signature to further authenticate the prooving process.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  signature: 'InProofV1MupvkPBMgUS3Se3X1jjJqjFmZpv2DfrU7AVPoSe7fizkC3C6fcXxEpFfPqVxzmWu8d1wcoBvqjaQoJUD7Wh133PzbG1CdRC2WfABu5kkg3Ko1e4nPjRZhgzLeDY464TVoTTJ'
    * }
    */
    getTxProof: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        txid: 'Hash',
        address: 'Address'
      }, opts)
      rpcHelpers.checkOptionalParametersType({ message: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_tx_proof', opts)
    },
    /**
    * Get RPC version Major & Minor integer-format, where Major is the first 16 bits and Minor the last 16 bits.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { release: false, version: 65548 }
    */
    getVersion: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'get_version')
    },
    /**
    * Import signed key images list and verify their spent status.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.signed_key_images - Signed key images.
    * @param {string} opts.signed_key_images[].key_image - Key image.
    * @param {string} opts.signed_key_images[].signature - Signature.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  height: 5536,
    *  spent: 343653984001,
    *  unspent: 141498689149
    * }
    */
    importKeyImages: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ signed_key_images: 'ArrayOfSignedKeyImages' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'import_key_images', opts)
    },
    /**
    * Import multisig info from other participants.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.info - List of multisig info in hex format from other participants.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { n_outputs: 1 }
    */
    importMultisigInfo: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ info: 'ArrayOfStrings' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'import_multisig_info', opts)
    },
    /**
    * Import outputs in hex format.
    * @async
    * @param {Object} opts
    * @param {string} opts.outputs_data_hex - Wallet outputs in hex format.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { num_imported: 24 }
    */
    importOutputs: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ outputs_data_hex: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'import_outputs', opts)
    },
    /**
    * Return a list of incoming transfers to the wallet.
    * @async
    * @param {Object} opts
    * @param {string} opts.transfer_type - "all": all the transfers, "available": only transfers which are not yet spent, OR "unavailable": only transfers which are already spent.
    * @param {number} [opts.account_index] - Return transfers for this account. (defaults to 0).
    * @param {number[]} [opts.subaddr_indices] - Return transfers sent to these subaddresses.
    * @param {boolean} [opts.verbose] - Enable verbose output, return key image if true.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  transfers:
    *  [
    *   {
    *    amount: 262791826099,
    *    global_index: 11793,
    *    key_image: '44fb690de7d1cd53b8e8541bf7e15b107cbf9d6f3df22b15cd3ce969913f48c5',
    *    spent: false,
    *    subaddr_index: [Object],
    *    tx_hash: 'f10f1629f2196466aa084aa2431a603f2f600178e6fb56019654a51f9c82f44f',
    *    tx_size: 763
    *   },
    *   ...
    *  ]
    * }
    */
    incomingTransfers: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ transfer_type: 'String' }, opts)
      rpcHelpers.checkOptionalParametersType({
        account_index: 'Integer',
        subaddr_indices: 'ArrayOfIntegers',
        verbose: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'incoming_transfers', opts)
    },
    /**
    * Check if a wallet is a multisig one.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  multisig: true,
    *  ready: true,
    *  threshold: 2,
    *  total: 2
    * }
    */
    isMultisig: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'is_multisig')
    },
    /**
    * Label an account.
    * @async

    * @param {Object} opts
    * @param {number} opts.account_index - Apply label to account at this index.
    * @param {string} opts.label - Label for the account.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    labelAccount: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        account_index: 'Integer',
        label: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'label_account', opts)
    },
    /**
    * Label an address.
    * @async
    * @param {Object} opts
    * @param {number} opts.index.major - Account index for the subaddress.
    * @param {number} opts.index.minor -  Index of the subaddress in the account.
    * @param {string} opts.label - Label for the new address.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    labelAddress: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        major: 'Integer',
        minor: 'Integer'
      }, opts.index)
      rpcHelpers.checkMandatoryParameters({ label: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'label_address', opts)
    },
    /**
    * Make an integrated address from the wallet address and a payment id.
    * @async
    * @param {Object} [opts]
    * @param {string} [opts.standard_address] - Defaults to primary address. Destination public address.
    * @param {string} [opts.payment_id] - Defaults to a random ID. 16 characters hex encoded.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  integrated_address: 'aRi1jaEgqSRHvoAkNKDLGKB8xVtSxUMf6e8UW7nKdVb6KFLxtYXBQqR6p9EstjPcqTZ5yb4L6RcWeXf5ijwo68MiCgHwN7uH3J843oBLn3e1Z',
    *  payment_id: '8ca523f5e9506fed'
    * }
    */
    makeIntegratedAddress: async function (opts) {
      rpcHelpers.checkOptionalParametersType({
        standard_address: 'Address',
        payment_id: 'PaymentId'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'make_integrated_address', opts)
    },
    /**
    * Make a wallet multisig by importing peers multisig string.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.multisig_info - List of multisig string from peers.
    * @param {number} opts.threshold - Amount of signatures needed to sign a transfer. Must be less or equal than the amount of signature in multisig_info.
    * @param {string} opts.password - Wallet password.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  address: 'as23DCaEx6j3ta9ZUrp1KYDeWehshV9uPNqw7EY8tsNW2XBdSc7g6UeWX7oPxam8m6SZpLFh9uZuT4btcg3vV6Xq1jBADk8Dj',
    *  multisig_info: ''
    * }
    */
    makeMultisig: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        multisig_info: 'ArrayOfStrings',
        threshold: 'Integer',
        password: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'make_multisig', opts)
    },
    /**
    * Create a payment URI using the official URI spec.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - Wallet address.
    * @param {number} [opts.amount] - The integer amount to receive, in atomic units.
    * @param {string} [opts.payment_id] - 16 or 64 character hexadecimal payment id.
    * @param {string} [opts.recipient_name] - Name of the payment recipient.
    * @param {string} [opts.tx_description] - Description of the reason for the tx.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  uri: 'scala:as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2?tx_payment_id=8ca523f5e9506fed&tx_amount=1.000000000&recipient_name=stagenet%20B&tx_description=test'
    * }
    */
    makeUri: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ address: 'Address' }, opts)

      rpcHelpers.checkOptionalParametersType({
        amount: 'Integer',
        payment_id: 'PaymentId',
        recipient_name: 'String',
        tx_description: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'make_uri', opts)
    },
    /**
    * Open a wallet. You need to have set the argument "–wallet-dir" when launching scala-wallet-rpc to make this work.
    * @async
    * @param {Object} opts
    * @param {string} opts.filename - Wallet name stored in –wallet-dir.
    * @param {string} [opts.password] - Only needed if the wallet has a password defined.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    openWallet: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ filename: 'String' }, opts)

      rpcHelpers.checkOptionalParametersType({ password: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'open_wallet', opts)
    },
    /**
    * Parse a payment URI to get payment information.
    * @async
    * @param {Object} opts
    * @param {string} opts.uri - This contains all the payment input information as a properly formatted payment URI.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  uri:
    *  {
    *   address: 'as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2',
    *   amount: 1000000000,
    *   payment_id: '8ca523f5e9506fed',
    *   recipient_name: 'stagenet B',
    *   tx_description: 'test'
    *  }
    * }
    */
    parseUri: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ uri: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'parse_uri', opts)
    },
    /**
    * Prepare a wallet for multisig by generating a multisig string to share with peers.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  multisig_info: 'MultisigV1Wqtpx5Nt5A3aLE5TKVwnTX7jvyCz7ZoKAHWhzM2fB3jnHDN4TPAY9Gbd5nfErL1KVjXG6rUCfL9NDdnnpNvtS4GyGGT7UxpDCtFGEyHUfRkU4ce9xX8vtoLMKLN8U62rL8RxHzLzjExt8WR1ZTa8PqzbzJj2MxeKFxbtoB7iyu522u13'
    * }
    */
    prepareMultisig: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'prepare_multisig')
    },
    /**
    * Return the spend or view private key.
    * @async
    * @param {Object} opts
    * @param {string} opts.key_type - Which key to retrieve: "mnemonic" - the mnemonic seed (older wallets do not have one) OR "view_key" OR "spend_key".
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { key: 'fa33f26d6ff9a77ef83e080aa6ae51e0d59b7d0e395e83100923e8c4708c3c0a' }
    */
    queryKey: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ key_type: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'query_key', opts)
    },
    /**
    * Refresh a wallet after opening.
    * @async
    * @param {Object} [opts]
    * @param {number} [opts.start_height] - The block height from which to start refreshing.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  blocks_fetched: 3,
    *  received_money: false
    * }
    */
    refresh: async function (opts) {
      rpcHelpers.checkOptionalParametersType({ start_height: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'refresh', opts)
    },
    /**
    * Relay a transaction previously created with "do_not_relay":true.
    * @async
    * @param {Object} opts
    * @param {string} opts.hex - Transaction metadata returned from a transfer method with get_tx_metadata set to true.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  fee: 0,
    *  tx_blob: '',
    *  tx_hash: 'd5131629c1fea507ff9e1aae4da4207c7addc7fe1700343834304aa1208fe284',
    *  tx_key: ''
    * }
    */
    relayTx: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ hex: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'relay_tx', opts)
    },
    /**
    * Rescan the blockchain from scratch.
    * When hard is set to true any information which can not be recovered from the blockchain itself will be lost. This includes destination addresses, tx secret keys, tx notes, etc.
    * @async
    * @param {Object} [opts]
    * @param {boolean} [opts.hard] - default is false.
    * @returns {Promise} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    rescanBlockchain: async function (opts) {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'rescan_blockchain', opts)
    },
    /**
    * Refresh a wallet after opening.
    * @async
    * @returns {Promise} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    rescanSpent: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'rescan_spent')
    },
    /**
    * Restore wallet using mnemonic seed.
    * @async
    * @param {Object} opts
    * @param {number} [opts.restore_height] - Start height for scanning the blockchain.
    * @param {string} opts.filename - Wallet filename.
    * @param {string} opts.seed - Mnemonic seed.
    * @param {string} [opts.seed_offset] - Seed offset.
    * @param {string} [opts.password] - Wallet password.
    * @param {string} [opts.language] - Language for the wallet seed.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  address: 'ar47HiRLKrEcQdgRhN2FTfEnJwkXoUWKH8WAwTucZ8RP9QxB2WMhh6Ffzhfh2panETahxdMX7cjhaiV6ShvG5gdY2iALecvcL',
    *  info: 'Wallet has been restored successfully.',
    *  seed: 'pulp peeled picked succeed wildly lymph edgy sushi limits hitched balding rising syndrome omission getting unafraid feline hornet darted mixture napkin remedy uptight wield unafraid',
    *  was_deprecated: false
    * }
    */
    restoreDeterministicWallet: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        filename: 'String',
        seed: 'String'
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        restore_height: 'Integer',
        seed_offset: 'String',
        password: 'String',
        language: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'restore_deterministic_wallet', opts)
    },
    /**
    * Set description for an account tag.
    * @async
    * @param {Object} opts
    * @param {string} opts.tag - The tag to add description.
    * @param {string} opts.description - Description for the tag.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    setAccountTagDescription: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        tag: 'String',
        description: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'set_account_tag_description', opts)
    },
    /**
    * Set arbitrary attribute.
    * @async
    * @param {Object} opts
    * @param {string} opts.key - Attribute name.
    * @param {string} opts.value - Attribute value.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    setAttribute: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        key: 'String',
        value: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'set_attribute', opts)
    },
    /**
    * Set the daemon to connect with.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - Use daemon instance at <host>:<port>.
    * @param {boolean} [opts.trusted] - Enable commands which rely on a trusted daemon.
    * @param {string} [opts.ssl_support] - Enable SSL on daemon RPC connections: enabled, disabled, autodetect.
    * @param {string} [opts.ssl_private_key_path] - Path to a PEM format private key.
    * @param {string} [opts.ssl_certificate_path] - Path to a PEM format certificate.
    * @param {string} [opts.ssl_ca_file] - Path to file containing concatenated PEM format certificate(s) to replace system CA(s).
    * @param {string[]} [opts.ssl_allowed_fingerprints] - List of valid fingerprints of allowed RPC servers.
    * @param {boolean} [opts.ssl_allow_any_cert] - Allow any SSL certificate from the daemon.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    setDaemon: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ address: 'String' }, opts)

      rpcHelpers.checkOptionalParametersType({
        trusted: 'Boolean',
        ssl_support: 'String',
        ssl_private_key_path: 'String',
        ssl_certificate_path: 'String',
        ssl_ca_file: 'String',
        ssl_allowed_fingerprints: 'ArrayOfStrings',
        ssl_allow_any_cert: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'set_daemon', opts)
    },
    /**
    * Set the daemon log categories. Categories are represented as a comma separated list of <Category>:<level> (similarly to syslog standard <Facility>:<Severity-level>).
    * @async
    * @param {Object} [opts]
    * @param {string} [opts.categories] - Daemon log categories to enable.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    * }
    */
    setLogCategories: async function (opts) {
      rpcHelpers.checkOptionalParametersType({ categories: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'set_log_categories', opts)
    },
    /**
    * Set the daemon log level. By default, log level is set to 0.
    * @async
    * @param {Object} opts
    * @param {number} opts.level - Wallet log level to set from 0 (less verbose) to 4 (most verbose).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    * }
    */
    setLogLevel: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ level: 'Integer' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'set_log_level', opts)
    },
    /**
    * Set arbitrary string notes for transactions.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.txids - Transaction ids.
    * @param {string[]} opts.notes - Notes for the transactions.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    setTxNotes: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        txids: 'ArrayOfHashes',
        notes: 'ArrayOfStrings'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'set_tx_notes', opts)
    },
    /**
    * Sign a string.
    * @async
    * @param {Object} opts
    * @param {string} opts.data - Anything you need to sign.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { signature: 'SigV1DXD2ELMXAZyREwEoVMinMyXww7nfdtwCje47UbUGHjDY8Qk6QF9Ckdz7EnbcpkXQ3h3FCDSNBr7Us3cqaPnoQswn' }
    */
    sign: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ data: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sign', opts)
    },
    /**
    * Sign a transaction in multisig.
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_data_hex - Multisig transaction in hex format, as returned by transfer under multisig_txset.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { tx_data_hex: '4172516d ... ',
    *   tx_hash_list: [ 'bf54ffccfaf56f4d6af9ca103eb35fc4ede31325eaead960bef296f4c7ea0a07' ]
    * }
    */
    signMultisig: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ tx_data_hex: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sign_multisig', opts)
    },
    /**
    * Set description for an account tag.
    * @async
    * @param {Object} opts
    * @param {string} opts.unsigned_txset - Set of unsigned tx returned by "transfer" or "transferSplit" methods.
    * @param {boolean} [opts.export_raw] - If true, return the raw transaction data. (Defaults to false).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  signed_txset:'4172516d41207 ...',
    *  tx_hash_list: ['11dc58c45e048cf4596ff4726b0130bf389933c55bc0b48f82d168980eca122e']
    * }
    */
    signTransfer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ unsigned_txset: 'String' }, opts)

      rpcHelpers.checkOptionalParametersType({ export_raw: 'Boolean' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sign_transfer', opts)
    },
    /**
    * Retrieve the standard address and payment id corresponding to an integrated address.
    * @async
    * @param {Object} opts
    * @param {string} opts.integrated_address - Integrated address.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  is_subaddress: false,
    *  payment_id: 'e558803fb1958fc8',
    *  standard_address: 'as3ne6ewX5GBfSkQZsWi5YWjTG9xRSA5fMYBM7sfawiqWr2n1qd5Y4JJEWKXE1dKRCNuVWQLeknUmWascmFBNwKi1zyBaB9n2'
    * }
    */
    splitIntegratedAddress: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ integrated_address: 'Address' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'split_integrated_address', opts)
    },
    /**
    * Start mining in the Scala daemon.
    * @async
    * @param {Object} opts
    * @param {number} opts.threads_count - Number of threads created for mining.
    * @param {boolean} opts.do_background_mining - Allow to start the miner in smart mining mode.
    * @param {boolean} opts.ignore_battery - Ignore battery status (for smart mining only).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    startMining: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        threads_count: 'Integer',
        do_background_mining: 'Boolean',
        ignore_battery: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'start_mining', opts)
    },
    /**
    * Refresh a wallet after opening.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    stopMining: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'stop_mining')
    },
    /**
    * Stops the wallet, storing the current state.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    stopWallet: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'stop_wallet')
    },
    /**
    * Save the wallet file.
    * @async
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    store: async function () {
      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'store')
    },
    /**
    * Submit a signed multisig transaction.
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_data_hex - Multisig transaction in hex format, as returned by sign_multisig under tx_data_hex.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { tx_hash_list: [ '0d8a5f9028000667a393a66f13ae8b25589694186b872a7f38fec5ef60150e10' ] }
    */
    submitMultisig: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ tx_data_hex: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'submit_multisig', opts)
    },
    /**
    * Set description for an account tag.
    * @async
    * @param {Object} opts
    * @param {string} opts.tx_data_hex - Set of signed tx returned by "sign_transfer".
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  tx_hash_list: [ '11dc58c45e048cf4596ff4726b0130bf389933c55bc0b48f82d168980eca122e' ]
    * }
    */
    submitTransfer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ tx_data_hex: 'String' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'submit_transfer', opts)
    },
    /**
    * Send all unlocked balance to an address.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - Destination public address.
    * @param {number} opts.account_index - Sweep transactions from this account.
    * @param {number[]} [opts.subaddr_indices] - Sweep from this set of subaddresses in the account.
    * @param {number} [opts.priority] - Priority for sending the sweep transfer, partially determines fee.
    * @param {number} opts.mixin - Number of outputs from the blockchain to mix with (0 means no mixing).
    * @param {number} opts.ring_size - Sets ringsize to n (mixin + 1).
    * @param {number} opts.unlock_time - Number of blocks before the ARQ can be spent (0 to not add a lock).
    * @param {string} [opts.payment_id] - Random 32-byte/64-character hex string to identify a transaction.
    * @param {boolean} [opts.get_tx_keys] -  Return the transaction keys after sending.
    * @param {number} [opts.below_amount] - Include outputs below this amount.
    * @param {boolean} [opts.do_not_relay] - If true, do not relay this sweep transfer. (Defaults to false).
    * @param {boolean} [opts.get_tx_hex] - Return the transactions as hex encoded string. (Defaults to false).
    * @param {boolean} [opts.get_tx_metadata] - Return the transaction metadata as a string. (Defaults to false).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  amount_list: [ 322790663594, 303554155996, 322790933785, 263080732210 ],
    *  fee_list: [ 105300, 105300, 105300, 97200 ],
    *  multisig_txset: '',
    *  tx_hash_list:
    *   [
    *    '1b192df60976e25f64aa161a6c8101aa58f9a4df8a807eda6efb45f6cc4c9954',
    *    '9ab16dc055543b93fd6cdb72088841453d8f0434c2c4fe0b973731a9802d2833',
    *    'cfdbb18284f0e48e2c3e90e365ff1fc027773016176cc5b45d6961b9783dcfb9',
    *    '7a515c0f87d5a1f330b46fe2b21eb13466b15499c2374c705f0e98ec7fd64471'
    *   ],
    *  unsigned_txset: ''
    * }
    */
    sweepAll: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        address: 'Address',
        account_index: 'Integer',
        mixin: 'Integer',
        ring_size: 'Integer',
        unlock_time: 'Integer'
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        subaddr_indices: 'ArrayOfIntegers',
        priority: 'Integer',
        payment_id: 'PaymentId',
        get_tx_keys: 'Boolean',
        below_amount: 'Integer',
        do_not_relay: 'Boolean',
        get_tx_hex: 'Boolean',
        get_tx_metadata: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sweep_all', opts)
    },
    /**
    * Send all dust outputs back to the wallet's, to make them easier to spend (and mix).
    * @async
    * @param {Object} opts
    * @param {boolean} [opts.get_tx_keys] - Return the transaction keys after sending.
    * @param {boolean} [opts.do_not_relay] - If true, the newly created transaction will not be relayed to the Scala network. (Defaults to false).
    * @param {boolean} [opts.get_tx_hex] - Return the transactions as hex string after sending. (Defaults to false).
    * @param {boolean} [opts.get_tx_metadata] - Return list of transaction metadata needed to relay the transfer later. (Defaults to false).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output when there is no dust.</b></caption>
    * {
    *  multisig_txset: '',
    *  unsigned_txset: ''
    * }
    */
    sweepDust: async function (opts) {
      rpcHelpers.checkOptionalParametersType({
        get_tx_keys: 'Boolean',
        do_not_relay: 'Boolean',
        get_tx_hex: 'Boolean',
        get_tx_metadata: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sweep_dust', opts)
    },
    /**
    * Send all of a specific unlocked output to an address.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - Destination public address.
    * @param {number} opts.account_index - Sweep transactions from this account.
    * @param {number[]} [opts.subaddr_indices] - Sweep from this set of subaddresses in the account.
    * @param {number} [opts.priority] - Priority for sending the sweep transfer, partially determines fee.
    * @param {number} opts.mixin - Number of outputs from the blockchain to mix with (0 means no mixing).
    * @param {number} opts.ring_size - Sets ringsize to n (mixin + 1).
    * @param {number} opts.unlock_time - Number of blocks before the ARQ can be spent (0 to not add a lock).
    * @param {string} [opts.payment_id] - Random 32-byte/64-character hex string to identify a transaction.
    * @param {boolean} [opts.get_tx_keys] -  Return the transaction keys after sending.
    * @param {number} [opts.below_amount] - Include outputs below this amount.
    * @param {boolean} [opts.do_not_relay] - If true, do not relay this sweep transfer. (Defaults to false).
    * @param {boolean} [opts.get_tx_hex] - Return the transactions as hex encoded string. (Defaults to false).
    * @param {boolean} [opts.get_tx_metadata] - Return the transaction metadata as a string. (Defaults to false).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  amount: 20178483807,
    *  fee: 32280,
    *  multisig_txset: '',
    *  tx_blob: '',
    *  tx_hash: 'c71baea6d6e159def22666487d43b7bb9d5ee4bd141497bf5b289714d0089b46',
    *  tx_key: '',
    *  tx_metadata: '',
    *  unsigned_txset: ''
    * }
    */
    sweepSingle: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        address: 'Address',
        account_index: 'Integer',
        mixin: 'Integer',
        ring_size: 'Integer',
        unlock_time: 'Integer',
        key_image: 'Hash'
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        subaddr_indices: 'ArrayOfIntegers',
        priority: 'Integer',
        payment_id: 'PaymentId',
        get_tx_keys: 'Boolean',
        below_amount: 'Integer',
        do_not_relay: 'Boolean',
        get_tx_hex: 'Boolean',
        get_tx_metadata: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'sweep_single', opts)
    },
    /**
    * Apply a filtering tag to a list of accounts.
    * @async
    * @param {Object} opts
    * @param {string} opts.tag - Tag for the accounts.
    * @param {number[]} opts.accounts - Tag this list of accounts.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    tagAccounts: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        tag: 'String',
        accounts: 'ArrayOfIntegers'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'tag_accounts', opts)
    },
    /**
    * Send ARQ to a number of recipients.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.destinations - Array of destinations to receive ARQ.
    * @param {number} opts.destinations[].amount - Amount to send to each destination, in atomic units.
    * @param {string} opts.destinations[].address - Destination public address.
    * @param {number} [opts.account_index] - Transfer from this account index. (Defaults to 0).
    * @param {number[]} [opts.subaddr_indices] - Transfer from this set of subaddresses. (Defaults to 0).
    * @param {number} opts.priority - Set a priority for the transaction. Accepted Values are: 0-3 for: default, unimportant, normal, elevated, priority.
    * @param {number} opts.mixin - Number of outputs from the blockchain to mix with (0 means no mixing).
    * @param {number} opts.ring_size - Number of outputs to mix in the transaction (this output + N decoys from the blockchain).
    * @param {number} opts.unlock_time - Number of blocks before the ARQ can be spent (0 to not add a lock).
    * @param {string} [opts.payment_id] - Random 32-byte/64-character hex string to identify a transaction.
    * @param {boolean} [opts.get_tx_key] - Return the transaction key after sending.
    * @param {boolean} [opts.do_not_relay] -  If true, the newly created transaction will not be relayed to the Scala network. (Defaults to false).
    * @param {boolean} [opts.get_tx_hex] - Return the transaction as hex string after sending (Defaults to false).
    * @param {boolean} [opts.get_tx_metadata] - Return the metadata needed to relay the transaction. (Defaults to false).
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  amount: 1000000000,
    *  fee: 121500,
    *  multisig_txset: '',
    *  tx_blob: '',
    *  tx_hash: '90796ef384f803d2aca1e32f0fce91a07b86ab8745cfaa1ebe60f7ae07c7e0d8',
    *  tx_key: '',
    *  tx_metadata: '',
    *  unsigned_txset: ''
    * }
    */
    transfer: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        destinations: 'ArrayOfDestinations',
        priority: 'Integer',
        mixin: 'Integer',
        ring_size: 'Integer',
        unlock_time: 'Integer'
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        account_index: 'Integer',
        subaddr_indices: 'ArrayOfIntegers',
        payment_id: 'PaymentId',
        get_tx_keys: 'Boolean',
        do_not_relay: 'Boolean',
        get_tx_hex: 'Boolean',
        get_tx_metadata: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'transfer', opts)
    },
    /**
    * Same as transfer, but can split into more than one tx if necessary.
    * @async
    * @param {Object} opts
    * @param {string[]} opts.destinations - Array of destinations to receive ARQ.
    * @param {number} opts.destinations[].amount - Amount to send to each destination, in atomic units.
    * @param {string} opts.destinations[].address - Destination public address.
    * @param {number} [opts.account_index] - Transfer from this account index. (Defaults to 0).
    * @param {number[]} [opts.subaddr_indices] - Transfer from this set of subaddresses. (Defaults to 0).
    * @param {number} opts.mixin - Number of outputs from the blockchain to mix with (0 means no mixing).
    * @param {number} opts.ring_size - Sets ringsize to n (mixin + 1).
    * @param {number} opts.unlock_time - Number of blocks before the ARQ can be spent (0 to not add a lock).
    * @param {string} [opts.payment_id] - Random 32-byte/64-character hex string to identify a transaction.
    * @param {boolean} [opts.get_tx_keys] - Return the transaction keys after sending.
    * @param {number} opts.priority - Set a priority for the transaction. Accepted Values are: 0-3 for: default, unimportant, normal, elevated, priority.
    * @param {boolean} [opts.do_not_relay] -  If true, the newly created transaction will not be relayed to the Scala network. (Defaults to false).
    * @param {boolean} [opts.get_tx_hex] - Return the transactions as hex string after sending.
    * @param {boolean} [opts.new_algorithm] - True to use the new transaction construction algorithm, defaults to false.
    * @param {boolean} [opts.get_tx_metadata] - Return list of transaction metadata needed to relay the transfer later.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  amount_list: [ 10000000000 ],
    *  fee_list: [ 121500 ],
    *  multisig_txset: '',
    *  tx_hash_list:
    *  [ '550a0ad4520bc6dc93e039e9d5e752302d27e13526e877074536948faf3c5a1f' ],
    *  unsigned_txset: ''
    * }
    */
    transferSplit: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        destinations: 'ArrayOfAddresses',
        priority: 'Integer',
        mixin: 'Integer',
        ring_size: 'Integer',
        unlock_time: 'Integer'
      }, opts)

      rpcHelpers.checkOptionalParametersType({
        account_index: 'Integer',
        subaddr_indices: 'ArrayOfIntegers',
        payment_id: 'PaymentId',
        get_tx_keys: 'Boolean',
        do_not_relay: 'Boolean',
        get_tx_hex: 'Boolean',
        new_algorithm: 'Boolean',
        get_tx_metadata: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'transfer_split', opts)
    },
    /**
    * Remove filtering tag from a list of accounts.
    * @async
    * @param {Object} opts
    * @param {number[]} opts.accounts - Remove tag from this list of accounts.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {}
    */
    untagAccounts: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ accounts: 'ArrayOfIntegers' }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'untag_accounts', opts)
    },
    /**
    * Parse an address to validate if it's a valid Scala address.
    * @async
    * @param {Object} opts
    * @param {string} opts.address - Wallet address to check.
    * @param {boolean} [opts.any_net_type] - If true check on all nets (mainnet, testnet, stagenet), else check if same net as the conencted wallet. Default is false.
    * @param {boolean} [opts.allow_openalias] - If true resolve the Openalias to an address. Default is false.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * {
    *  integrated: false,
    *  nettype: 'stagenet',
    *  openalias_address: '',
    *  subaddress: false,
    *  valid: true
    * }
    */
    validateAddress: async function (opts) {
      rpcHelpers.checkMandatoryParameters({ address: 'Address' }, opts)

      rpcHelpers.checkOptionalParametersType({
        any_net_type: 'Boolean',
        allow_openalias: 'Boolean'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'validate_address', opts)
    },
    /**
    * Verify a signature on a string.
    * @async
    * @param {Object} opts
    * @param {string} opts.data - What should have been signed.
    * @param {string} opts.address - Public address of the wallet used to sign the data.
    * @param {string} opts.signature - Signature generated by sign method.
    * @returns {Promise<object>} Promise object.
    * @example <caption><b>Output</b></caption>
    * { good: true }
    */
    verify: async function (opts) {
      rpcHelpers.checkMandatoryParameters({
        data: 'String',
        address: 'Address',
        signature: 'String'
      }, opts)

      return rpcHelpers.makeJsonQuery(httpClient, jsonAddress, queue, parseWalletResponse, 'verify', opts)
    }
  }
}
exports = module.exports = rpcWallet
