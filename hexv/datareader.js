const DataReader = {
  source: null,
  offset: 0,
  le: true,
  nativeEndianness: true,
  offsetStack: [],
  byteOrderStack: [],
  BigEndian:false,
  LittleEndian:true,
  types: {
    "uint8": 8,
    "int8": 8,
    "uint16": 16,
    "int16": 16,
    "uint32": 32,
    "int32": 32,
    "uint64": 64,
    "float32": 32,
    "float64": 64,
    "ascii": 8
  },
  load: function(file, callback){
    this.nativeEndianness = this.getEndianness();
    this.le = this.nativeEndianness;
    let fileReader = new FileReader();
    fileReader.onload = (event) => {
      this.source = new DataView(event.target.result, 0, file.size);
      callback(this);
    }
    fileReader.readAsArrayBuffer(file);
  },
  withDataView: function(dataView, callback){
    this.nativeEndianness = this.getEndianness();
    this.le = this.nativeEndianness;
    this.source = dataView;
    callback(this);
  },
  pushByteOrder(newLE){
    this.byteOrderStack.push(this.le);
    this.le = newLE;
  },
  popByteOrder(){
    this.le = this.byteOrderStack.pop();
  },
  getEndianness: function(){
    let uInt16 = new Uint16Array([0xFF00]);
    let uInt8 = new Uint8Array(uInt16.buffer);
    return uInt8[0] === 0x00;
  },
  getUInt8: function(offset=this.offset){
    return this.source.getUint8(offset);
  },
  getInt8: function(offset=this.offset){
    return this.source.getInt8(offset);
  },
  getUInt16: function(offset=this.offset, le=this.le){
    return this.source.getUint16(offset, le);
  },
  getInt16: function(offset=this.offset, le=this.le){
    return this.source.getInt16(offset, le);
  },
  getUInt24: function(offset=this.offset, le=this.le){
    //return this.getUIntBytes(3, offset, le);
    let o1 = offset + (le ? 2 : 0), o2 = offset + (le ? 0 : 1);
    return (this.source.getUint8(o1) << 16) | this.source.getUint16(o2,true);
    return le
    ? (this.source.getUint8((offset + 2)) << 16) | (this.source.getUint16(offset,true))
    : (this.source.getUint8(offset) << 16) | (this.source.getUint16((offset + 1),false));
  },
  getInt24: function(offset=this.offset, le=this.le){
    //return this.getIntBytes(3, offset, le);
    return le
      ? (this.source.getInt8((offset + 2)) << 16) | (this.source.getUint16(offset,true))
      : (this.source.getInt8(offset) << 16) | (this.source.getUint16((offset + 1),false));
  },
  getUInt32: function(offset=this.offset, le=this.le){
    return this.source.getUint32(offset, le);
  },
  getInt32: function(offset=this.offset, le=this.le){
    return this.source.getInt32(offset, le);
  },
  getInt40: function(offset=this.offset, le=this.le){
    return this.getIntBytes(5, offset,le);
  },
  getUInt40: function(offset=this.offset, le=this.le){
    return this.getUIntBytes(5, offset,le);
  },
  getUInt64: function(offset=this.offset, le=this.le){
    return this.source.getBigUint64(offset, le);
  },
  getInt64: function(offset=this.offset, le=this.le){
    return this.source.getBigInt64(offset, le);
  },
  getFloat32: function(offset=this.offset, le=this.le){
    return this.source.getFloat32(offset,le);
  },
  getFloat64: function(offset=this.offset, le=this.le){
    return this.source.getFloat64(offset,le);
  },
  getIntBytes: function(bytes, offset=this.offset, le=this.le){
    let out;
    if (bytes > 4){
      // hack this, since js does not support int32+ let us build
      // an hex string and parse it to int at the end
      out = "";
      for (let i = 0; i < bytes; i++)
        out += (this.source.getUint8(offset + (le ? (bytes - i - 1) : i)) & 0xff).strHex(2,false);
      out = parseInt("0x"+out);
    } else {
      out = 0;
      for (let i = 0; i < bytes; i++)
        out = (out << 8) | (this.source.getUint8(offset + (le ? (bytes - i - 1) : i)) & 0xff);
    }
    return out;
  },
  getUIntBytes: function(bytes, offset=this.offset, le=this.le){
    return this.getIntBytes(bytes, offset, le) >>> 0;
  },
  getUIntBits: function(bits, offset=this.offset, le=this.le){
    return this.getIntBits(bits, offset, le) >>> 0;
  },
  getIntBits: function(bits, offset=this.offset, le=this.le){
    return this.getIntBytes((bits/8) & 0xff, offset, le);
  },
  getFP80: function(offset=this.offset, le=this.le){
    // todo: implement this
    // as in https://moocaholic.medium.com/fp64-fp32-fp16-bfloat16-tf32-and-other-members-of-the-zoo-a1ca7897d407
    let high = parseInt(this.getUInt64(offset, le));
    let low = this.getInt32(offset + 8, le);
    return high + low / Math.pow(2, 32);
  },
  getFP64: function(offset=this.offset, le=this.le){
    // todo: implement this
    let high = this.getUIntBits(n,offset,le);
    let low = this.getInt32(offset + 4, le);
    return high + low / Math.pow(2, 32);
  },
  checkOffset: function(newOffset, len=0){
    return newOffset + len < this.source.byteLength;
  },
  pushOffset: function(newOffset){
    this.offsetStack.push(this.offset);
    if (newOffset && this.checkOffset(newOffset))
      this.offset = newOffset;
  },
  popOffset: function(){
    let out = this.offset;
    this.offset = this.offsetStack.pop();
    return out;
  },
  doAtOffset: function(offset, fn){
    if (this.checkOffset(offset)){
      this.pushOffset(offset);
      fn;
      this.popOffset();
    }
  },
  findString(str, start=true){
    let bytes = Array.from(new TextEncoder().encode(str));
    let len = bytes.length;
    while(this.offset < this.source.byteLength){
      let cmp = this.getUInt8Array(len);
      if (this.findSubarray(cmp, bytes) === 0)
        break;
      this.offset++;
    }
    if (!start)
      this.offset += len;
  },

  findSubarray(arr, subarr) {
    for (var i = 0; i < 1 + (arr.length - subarr.length); i++) {
        var j = 0;
        for (; j < subarr.length; j++)
            if (arr[i + j] !== subarr[j])
                break;
        if (j == subarr.length)
            return i;
    }
    return -1;
  },

  getUInt8Array(len){
    let out = [];
    for (let i = 0 ; i < len ; i++)
      out.push(this.source.getUint8(this.offset + i));
    return out;
  },

  uint8At(offset, defVal=-1){
    return offset < this.source.byteLength
      ? this.source.getUint8(offset)
      : defVal;
  },
  hexUInt8At(offset,defVal=" "){
    return offset < this.source.byteLength
      ? this.strHex(this.source.getUint8(offset), 1)
      : defVal;
  },
  arrayOf: function(value, n, valueBits=32, le=this.nativeEndianness){
    n = Math.min(n * 8, valueBits);
    let out = [];
    if (le != this.nativeEndianness){
      for (let i = 0; i < n; i += 8)
        out.push((value >> i) & 0xff);
    } else {
      for (let i = n - 8; i >= 0; i -= 8)
        out.push((value >> i) & 0xff);
    }
    return out;
  },
  parseUInt8: function(value, valueBits=32, le=this.nativeEndianness){
    if (le != this.nativeEndianness){
      value = valueBits == 32
        ? this.swap32(value)
        : this.swap16(value);
     }
     return value && 0xff;
  },
  parseInt8: function(value, valueBits=32, le=this.nativeEndianness){
    // using sign-propagating right shift to parse js native 32bit number interp
    return this.parseUInt8(value, valueBits, le) << 24 >> 24;
  },
  parseUInt16: function(value, valueBits=32, le=this.nativeEndianness){
    if (le != this.nativeEndianness) return value & 0xffff;
    // 32bit: AA BB CC DD -> (shift 16) AA BB -> BB AA
    // 16bit: AA BB -> BB AA
    return this.swap16(valueBits === 32 ? value >> 16 : value) && 0xffff;
  },
  parseInt16: function(type, value, le=this.nativeEndianness){
    return this.parseUInt16(type, value, le) << 16 >> 16;
  },
  parseUInt32: function(value, le=this.nativeEndianness){
    return le == this.nativeEndianness ? value : this.swap32(value);
  },
  parseInt32: function(value, le=this.nativeEndianness){
    return this.parseUInt32(value,le) << 1 >> 1 // ??????
  },
  readURational: function(expand=true, le=this.le){
    let num = this.readUInt32(le);
    let den = this.readUInt32(le);
    return expand && den != 0 ? num / den : {
      num: num,
      den: den,
    }
  },
  readRational: function(expand=true, le=this.le){
    let num = this.readInt32(le);
    let den = this.readInt32(le);
    return expand && den != 0 ? num / den : {
      num: num,
      den: den,
    }
  },
  readURationalAt: function(offset, expand=true, le=this.le){
    this.pushOffset(offset);
    let out=this.readURational(expand,le);
    this.popOffset();
    return out;
  },
  readRationalAt: function(offset, expand=true, le=this.le){
    this.pushOffset(offset);
    let out=this.readRational(expand,le);
    this.popOffset();
    return out;
  },
  readUInt8: function(){
    let r = this.source.getUint8(this.offset);
    this.offset += 1;
    return r;
  },
  readInt8: function(){
    let r = this.source.getInt8(this.offset);
    this.offset += 1;
    return r;
  },
  readUInt16: function(le=this.le){
    let r = this.source.getUint16(this.offset, le);
    this.offset += 2;
    return r;
  },
  readInt16: function(le=this.le){
    let r = this.source.getInt16(this.offset, le);
    this.offset += 2;
    return r;
  },
  readInt24: function(le=this.le){
    let r = this.getInt24(le);
    this.offset += 3;
    return r;
  },
  readUInt24: function(le=this.le){
    let r = this.getUInt24(le);
    this.offset += 3;
    return r;
  },
  readUInt32: function(le=this.le){
    let r = this.source.getUint32(this.offset, le);
    this.offset += 4;
    return r;
  },
  readInt32: function(le=this.le){
    let r = this.source.getInt32(this.offset, le);
    this.offset += 4;
    return r;
  },
  readUInt64: function(le=this.le){
    let r = this.source.getBigUint64(this.offset, le);
    this.offset += 8;
    return parseInt(r);
  },
  readInt64: function(le=this.le){
    let r = this.source.getBigInt64(this.offset, le);
    this.offset += 8;
    return parseInt(r);
  },
  readIntN: function(bits, offset=this.offset,le=this.le){
    let r = this.getIntBits(bits, offset, le);
    this.offset += n;
    return r;
  },
  readUIntN: function(bits, offset=this.offset,le=this.le){
    return this.readUIntBits(bits, offset, le) >>> 0;
  },
  readUInt8Array: function(len){
    if (this.checkOffset(this.offset, len)){
      let r = [];
      while(len-- > 0)
        r.push(this.readUInt8());
      return r;
    }
  },
  readUInt8ArrayAt: function(offset, len){
    this.pushOffset(offset);
    this.readUInt8Array(len);
    this.popOffset();
  },
  readUInt16Array: function(len){
    if (this.checkOffset(this.offset, len)){
      let r = [];
      while(len-- > 0)
        r.push(this.readUInt16());
      return r;
    }
  },
  readUInt16ArrayAt: function(offset, len){
    this.pushOffset(offset);
    this.readUInt16Array(len);
    this.popOffset();
  },
  readUInt32Array: function(len){
    if (this.checkOffset(this.offset, 4 * len)){
      let r = [];
      while(len-- > 0)
        r.push(this.readUInt32());
      return r;
    }
  },
  readUInt32ArrayAt: function(offset, len){
    this.pushOffset(offset);
    this.readUInt32Array(len);
    this.popOffset();
  },
  readUInt8Parse: function(callback, le=this.le){
    let r = this.readUInt8(le);
    callback(r);
  },
  readUParse: function(nbytes, callback, le=this.le){
    switch(nbytes){
      case 1: callback(this.readUInt8(le)); break;
      case 2: callback(this.readUInt16(le)); break;
      case 3: callback(this.readUInt24(le)); break;
      case 4: callback(this.readUInt32(le)); break;
      case 8: callback(this.readUInt64(le)); break;
    }
  },
  readSParse: function(nbytes, callback, le=this.le){
    switch(nbytes){
      case 1: callback(this.readInt8(le)); break;
      case 2: callback(this.readInt16(le)); break;
      case 3: callback(this.readInt24(le)); break;
      case 4: callback(this.readInt32(le)); break;
      case 8: callback(this.readInt64(le)); break;
    }
  },
  readUInt4: function(obj, keyHi, keyLo){
    let r = this.readUInt8();
    obj[keyHi] = (r >> 4) & 0x0f;
    obj[keyLo] = r & 0x0f;
  },
  readUInt(n){
    if (n == 0) return 0;
    if (n == 1) return this.readUInt8();
    if (n == 2) return this.readUInt16();
    if (n == 3) return this.readUInt24();
    if (n == 4) return this.readUInt32();
  },
  readString: function(len=this.source.byteLength){
    if (len > 0 && (len + this.offset) < this.source.byteLength){
      let arr = this.readUInt8Array(len);
      return String.fromCharCode.apply(String, arr);
    }
    let limit = Math.min(this.offset + len + 1, this.source.byteLength);
    var str = '', c;
    while ((c = this.readUInt8()) != 0 && this.offset < limit)
      str += String.fromCharCode(c);
    return str;
  },
  readStringAt: function(offset, len=this.source.byteLength){
    this.pushOffset(offset);
    let str = this.readString(len);
    this.popOffset();
    console.log("readStringAt " + offset + " of len " + len + ": " + str);
    return str;
  },
  readFixed: function(){
    return this.readInt32() / (1 << 16);
  },
  readFword: function(){
    return this.readUIntBits(40);
  },
  readF2DOT14: function(){
    return this.readUInt16()/(1 << 14);
  },
  readUInt24: function(le=this.le){
    return this.readUIntBytes(3,le);
  },

  readUInt48: function(){
    return this.le
      ? (this.readUInt32() << 16) | (this.readUInt16())
      : (this.readUInt16() << 32) | (this.readUInt32())
  },
  readLONGDATETIME: function(){
    let v = this.readUInt32()
    this.skip(4);
    return v;
    //let v = this.readUInt64()/BigInt(1 << 16);
    //return v.toString();
  },
  readBits: function(n){
    let a = n % 8;
    let b = ((n / 8) & 0xff) + 1;
    var out = 0;
    if (this.le){
      for (let i = 0 ; i < b; i++)
        out |= (r.readUInt8() << (i * 8));
    } else {
      for (let i = b - 1 ; i >= 0; i--)
        out |= (r.readUInt8() << (i * 8));
    }
    return out & (Math.pow(2, b) - 1)
  },
  skip: function(bytes){
    this.offset += bytes;
  },
  skipNull: function(){
    while(this.source.getUint8(this.offset) === 0)
      this.offset++;
  },
  splitUInt8: function(src, srcSize, le=this.le){
    return le ? src & 0xff : (src >> srcSize) & 0xff;
  },
  splitUInt16: function(src, srcSize, le=this.le){
    const result = le ? src & 0xffff : (src >> 16) & 0xffff;
    console.log(`splitUInt16: src=${src} sz=${srcSize} ${le ? 'LE' : 'BE'}: ${result}`);
    return result;
  },
  swap16: function(value){
    return ((value & 0xff) << 8) | ((value >> 8) & 0xff);
  },
  swap32: function(value){
    return ((value & 0xff) << 24) | ((value & 0xff00) << 8) | ((value >> 8) & 0xff00) | ((value >> 24) & 0xff);
  },
  uint32to16: function(val, le=this.nativeEndianness){
    return le == this.nativeEndianness
      ? val & 0xffff
      : (val >> 16) & 0xffff;
  },
  uint32toUint8Array: function(val, le=this.le){
    return le
      ? [ val & 0xff, (val >> 8) & 0xff, (val >> 16) & 0xff, (val >> 24) & 0xff ]
      : [ (val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff ]
  },
  uint16toUint8Array: function(val, le=this.le){
    return le
      ? [ val & 0xff, (val >> 8) & 0xff ]
      : [ (val >> 8) & 0xff, val & 0xff ]
  },
  addUInt8: function(obj, ...keys){
    keys.forEach((key) => obj[key] = this.readUInt8());
  },
  addUInt16: function(obj, ...keys){
    keys.forEach((key) => obj[key] = this.readUInt16());
  },
  addInt16: function(obj, ...keys){
    keys.forEach((key) => obj[key] = this.readInt16());
  },
  addUInt32: function(obj, ...keys){
    keys.forEach((key) => obj[key] = this.readUInt32());
  },
  addUInt64: function(obj, ...keys){
    keys.forEach((key) => obj[key] = this.readUInt64());
  },
  addInt64: function(obj, ...keys){
    keys.forEach((key) => obj[key] = this.readInt64());
  },
  intNtoByteArray: function(n, val, le=this.le){
    let out = [];
    if (le){
      for (let i = 0; i <= n; i += 8)
        out.push((val >> i) & 0xff);
    } else {
      for (let i = n; i >= 0; i -= 8)
        out.push((val >> i) & 0xff);
    }
    return out;
  },
  intNtoString: function(n, val, le=this.le){
    var out = '';
    if (le){
      for (let i = 0; i <= n; i += 8)
        out += String.fromCharCode(((val >> i) & 0xff));
    } else {
      for (let i = n; i >= 0; i -= 8)
        out += String.fromCharCode(((val >> i) & 0xff));
    }
    return out;
  },
  stringOfUInt16: function(int16, le=this.le){
    return this.intNtoString(16, int16, le);
  },
  stringOfUInt32: function(int32, le=this.le){
    return this.intNtoString(32, int32, le);
  },
  stringOfUInt64: function(int64, le=this.le){
    return this.intNtoString(64, int64, le);
  },
  stringOfArray: function(arr){
    var str = '';
    arr.forEach(e => str += String.fromCharCode(e));
    return str;
  },
  strHex: function(v, pad){
    pad = pad || Math.floor(Math.log(v)/Math.log(256) + 1) * 2;
    return "0x" + v.toString(16).padStart(pad, '0');
  }
}