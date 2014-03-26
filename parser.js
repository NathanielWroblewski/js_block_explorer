require('buffertools').extend()

var fs            = require('fs')
  , MessageParser = require('crypto-binary').MessageParser
  , Promise       = require('es6-promise').Promise
  , rawBlockChain = fs.readFileSync('./blk00000.dat')
  , BigInteger    = require('bigi');

var blockExplorer = {
  magic:     new Buffer('f9beb4d9', 'hex'),
  blockFile: new MessageParser(rawBlockChain),

  explore: function () {
    while (true) {
      this.checkForErrors(this.blockFile.raw(4))
      this.streamBlock()
      this.parseBlockHeaders()
      this.parseTransactions()
    }
  },

  // validations

  checkForErrors: function(nextChunk) {
    if (this.endOfFile(nextChunk))    throw Error('End of file.')
    if (this.noMagicFound(nextChunk)) throw Error('No magic found.')
  },

  endOfFile: function(nextChunk) {
    return nextChunk === false
  },

  noMagicFound: function(possibleMagic){
    return possibleMagic.compare(this.magic) !== 0
  },

  // parse block

  streamBlock: function() {
    var blockLength    = this.blockFile.readUInt32LE()
    var rawBlockBuffer = this.blockFile.raw(blockLength)
    this.blockBuffer   = new MessageParser(rawBlockBuffer)
  },

  // block headers

  parseBlockHeaders: function() {
    var version           = this.blockBuffer.readUInt32LE()
      , previousBlockHash = this.format(this.blockBuffer.raw(32))
      , merkleRoot        = this.format(this.blockBuffer.raw(32))
      , timeStamp         = new Date(this.blockBuffer.readUInt32LE() * 1000)
      , targetDifficulty  = this.format(this.blockBuffer.raw(4))
      , nonce             = this.blockBuffer.readUInt32LE()
    console.log(previousBlockHash)
  },

  // transactions

  parseTransactions: function() {
    var transactionCount = this.blockBuffer.readVarInt()
    for (var i=0; i<transactionCount; ++i) {
      this.parseSingleTransaction()
    }
  },

  parseSingleTransaction: function() {
    var transactionVersionNumber = this.blockBuffer.readUInt32LE()
    this.parseAllInputs()
    this.parseAllOutputs()
    var transactionLockTime = this.blockBuffer.readUInt32LE()
  },

  // transaction inputs

  parseAllInputs: function() {
    var inputCount = this.blockBuffer.readVarInt()
    for (var j=0; j<inputCount; ++j) {
      this.parseTransactionInputs()
    }
  },

  parseTransactionInputs: function() {
    var previousTransactionHash  = this.format(this.blockBuffer.raw(32))
      , previousTransactionIndex = this.blockBuffer.readUInt32LE()
      , scriptLength             = this.blockBuffer.readVarInt()
      , inputScript              = this.format(this.blockBuffer.raw(scriptLength))
      , sequenceNumber           = this.format(this.blockBuffer.raw(4))
  },

  // transaction outputs

  parseAllOutputs: function() {
    var outputCount = this.blockBuffer.readVarInt()
    for (var j=0; j<outputCount; ++j) {
      this.parseTransactionOutputs()
    }
  },

  parseTransactionOutputs: function() {
    var satoshis           = this.value(this.blockBuffer.raw(8))
      , outputScriptLength = this.blockBuffer.readVarInt()
      , scriptPubKey       = this.format(this.blockBuffer.raw(outputScriptLength))
  },

  // utils
  format: function(buffer) {
    return buffer.reverse().toString('hex')
  },

  value: function(satoshiBuffer) {
    return BigInteger(this.format(satoshiBuffer), 16).toString(10)
  }
}

blockExplorer.explore()
