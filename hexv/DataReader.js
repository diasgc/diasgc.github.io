class DataReader {

  constructor(file){
    this.offset = 0;
    this.nativeLE = this.isNativeLE();
    this.le = this.nativeByteOrder;
    this.offsetStack = [];
    let fileReader = new FileReader();
    fileReader.onload = (event) => this.source = new DataView(event.target.result, 0, file.size);
    fileReader.readAsArrayBuffer(file);
  }

  isNativeLE(){
    let uInt16 = new Uint16Array([0xFF00]);
    let uInt8 = new Uint8Array(uInt16.buffer);
    return uInt8[0] === 0x00;
  }

  types = {
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
  }

  //#region offset functions
  checkOffset(newOffset=this.offset, len=0){
    return newOffset + len < this.source.byteLength;
  }
  
  pushOffset(newOffset=this.offset){
    this.offsetStack.push(this.offset);
    this.offset = newOffset;
  }

  popOffset(){
    let out = this.offset;
    this.offset = this.offsetStack.pop();
    return out;
  }

  onOffset(callback, newOffset=this.offset){
    this.pushOffset(newOffset);
    callback();
    this.popOffset();
  }
  //#endregion

  //#region get-functions
  getUInt8(offset=this.offset){
    return this.source.getUint8(offset);
  }
  getInt8(offset=this.offset){
    return this.source.getInt8(offset);
  }
  getUInt16(offset=this.offset, le=this.le){
    return this.source.getUint16(offset, le);
  }
  getInt16(offset=this.offset, le=this.le){
    return this.source.getInt16(offset, le);
  }
  getUInt32(offset=this.offset, le=this.le){
    return this.source.getUint32(offset, le);
  }
  getInt32(offset=this.offset, le=this.le){
    return this.source.getInt32(offset, le);
  }
  getUInt64(offset=this.offset, le=this.le){
    return this.source.getBigUint64(offset, le);
  }
  getInt64(offset=this.offset, le=this.le){
    return this.source.getBigInt64(offset, le);
  }
  getFloat32(offset=this.offset, le=this.le){
    return this.source.getFloat32(offset,le);
  }
  getFloat64(offset=this.offset, le=this.le){
    return this.source.getFloat64(offset,le);
  }

  // arrays
  getUInt8Array(offset=this.offset, len=1){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getUint8(this.offset + i));
      return out;
    }
  }
  getInt8Array(offset=this.offset, len=1){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getInt8(this.offset + i));
      return out;
    }
  }
  getUInt16Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getUint16(this.offset + i));
      return out;
    }
  }
  getInt16Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getInt16(this.offset + i));
      return out;
    }
  }
  getUInt32Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getUint32(this.offset + i));
      return out;
    }
  }
  getInt32Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getInt32(this.offset + i));
      return out;
    }
  }
  getUInt64Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getBigUint64(this.offset + i));
      return out;
    }
  }
  getInt64Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getBigInt64(this.offset + i));
      return out;
    }
  }
  getFloat32Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getBigInt64(this.offset + i));
      return out;
    }
  }
  getFloat64Array(offset=this.offset, len=1, le=this.le){
    if (this.checkOffset(offset,len)){
      let out = [];
      for (let i = 0 ; i < len ; i++)
        out.push(this.source.getBigInt64(this.offset + i));
      return out;
    }
  }
  //#endregion

  //#region read-functions
  readUInt8(){
    return this.getUint8(this.offset++);
  }
  readInt8(){
    return this.getInt8(this.offset++);
  }
  readUInt16(le=this.le){
    let r = this.source.getUint16(this.offset, le);
    this.offset += 2;
    return r;
  }
  readInt16(le=this.le){
    let r = this.source.getInt16(this.offset, le);
    this.offset += 2;
    return r;
  }
  readUInt32(le=this.le){
    let r = this.source.getUint32(this.offset, le);
    this.offset += 4;
    return r;
  }
  readInt32(le=this.le){
    let r = this.source.getInt32(this.offset, le);
    this.offset += 4;
    return r;
  }
  readUInt64(le=this.le){
    let r = this.source.getBigUint64(this.offset, le);
    this.offset += 8;
    return r;
  }
  readInt64(le=this.le){
    let r = this.source.getBigInt64(this.offset, le);
    this.offset += 8;
    return r;
  }
  readFloat32(le=this.le){
    let r = this.source.getFloat32(this.offset, le);
    this.offset += 4;
    return r;
  }
  readFloat64(offset=this.offset, le=this.le){
    let r = this.source.getFloat64(this.offset, le);
    this.offset += 8;
    return r;
  }

  // arrays
  readUInt8Array(len=1, offset=this.offset){
    let ret = this.getUInt8Array(len);
    if (ret){
      this.offset += len;
      return ret;
    }
  }
  readInt8Array(len=1, offset=this.offset){
    let ret = this.getInt8Array(offset=this.offset, len);
    if (ret){
      this.offset += len;
      return ret;
    }
  }
  readUInt16Array(offset=this.offset, len=1, le=this.le, offset=this.offset){
    let ret = this.getUInt16Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 2;
      return ret;
    }
  }
  readInt16Array(offset=this.offset, len=1, le=this.le, offset=this.offset){
    let ret = this.getInt16Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 2;
      return ret;
    }
  }
  readUInt32Array(offset=this.offset, len=1, le=this.le, offset=this.offset){
    let ret = this.getUInt32Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 4;
      return ret;
    }
  }
  readInt32Array(offset=this.offset, len=1, le=this.le, offset=this.offset){
    let ret = this.getInt32Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 4;
      return ret;
    }
  }
  readUInt64Array(offset=this.offset, len=1, le=this.le, offset=this.offset){
    let ret = this.getUInt64Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 8;
      return ret;
    }
  }
  readInt64Array(offset=this.offset, len=1, le=this.le, offset=this.offset){
    let ret = this.getUInt64Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 8;
      return ret;
    }
  }
  readFloat32Array(len=1, le=this.le, offset=this.offset){
    let ret = this.getFloat32Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 4;
      return ret;
    }
  }

  readFloat64Array(len=1, le=this.le, offset=this.offset){
    let ret = this.getFloat32Array(offset=this.offset, len);
    if (ret){
      this.offset += len * 8;
      return ret;
    }
  }
}
 //#endregion