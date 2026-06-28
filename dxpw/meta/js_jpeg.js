const f_jpeg = {
  JpegMarker: function(r){
    r.le = false;
    let m = {
      tag: '---',
      dsc: 'Unknown',
      offset: r.offset,
      id: r.readUInt16()
    };
    
    if (m.id < 0xFF00)
      return undefined;
    
    switch(m.id){
      case 0xFFD8: return this.setTagDsc(m, "SOI", "Start Of Image");
      case 0xFFD9: return this.setTagDsc(m, "EOI","End of Image");
      case 0xFFDA: return this.setTagDsc(m, "SOS", "Start of Scan");
      case 0xFFC4: return this.DHT(r, m);
      case 0xFFDB: return this.DQT(r, m);
      case 0xFFE0: return this.APP0(r, m);
      case 0xFFE1: return this.APP1(r, m);
    }
    if (m.id < 0xFF02){
      return this.setTagDsc(m, "TEM", "Temporary use for Arithmetic coding");
    } else if (m.id < 0xFFC0){
      return this.setTagDsc(m, "RES", "Reserved");
    } else if (m.id < 0xFFD0){
        switch (m.id){
          case 0xFFC8: return this.setTagDsc(m, "JPG","JPEG Extensions");
          case 0xFFCC: return this.setTagDsc(m, "DAC","Define Arithmetic Coding");
        }
        return this.SOFn(r, m);
    } else if (m.id < 0xFFD8){
        return this.RSTn(r,m);
    } else if (m.id < 0xFFE0){
        switch (m.id){
            case 0xFFDC: return this.setTagDsc(m, "DNL", "Define Number of Lines");
            case 0xFFDD: return this.setTagDsc(m, "DRI", "Define Restart Interval");
            case 0xFFDE: return this.setTagDsc(m, "DHP", "Define Hierarchical Progression");
            case 0xFFDF: return this.setTagDsc(m, "EXP", "Expand Reference Component");
        }
    } else if (m.id < 0xFFF0){
        m = this.APPn(r, m);
    } else if (m.id < 0xFFF8){
        return this.JPGn(r, m);
    } else if (m.id == 0xFFFE){
        m.tag = "COM"; m.dsc = "Comment";
    }
    return m;
  },
  setTagDsc: function(obj, tag, dsc){
    obj.tag = tag;
    obj.dsc = dsc;
    return obj;
  },
  fmtUnknownVal: function(val){
    return "Unknown " + this.strHex(val);
  },
  strHex: function(v){
    let pad = Math.floor(Math.log(v)/Math.log(256) + 1) * 2;
    return "0x" + v.toString(16).padStart(pad, '0');
  },
  DHT: function(r, m){
    let dht = {
      tag: "DHT",
      dsc: "Define Huffman Table",
      offset: m.offset,
      id: m.id,
      size: r.readUInt16(),
    };
    r.readUInt4(dht, "identifier", "class");
    dht.codes = r.readUInt8Array(16);
    return dht;
  },
  SOFn: function(r,m){
    let sofn = {};
    switch (m.id){
      case 0xFFC0: this.setTagDsc(sofn, "SOF0", "Baseline DCT"); break;
      case 0xFFC1: this.setTagDsc(sofn, "SOF1","Extended Sequential DCT"); break;
      case 0xFFC2: this.setTagDsc(sofn, "SOF2","Progressive DCT"); break;
      case 0xFFC3: this.setTagDsc(sofn, "SOF3","Lossless (sequential)"); break;
      case 0xFFC5: this.setTagDsc(sofn, "SOF5","Differential sequential DCT"); break;
      case 0xFFC6: this.setTagDsc(sofn, "SOF6","Differential progressive DCT"); break;
      case 0xFFC7: this.setTagDsc(sofn, "SOF7","Differential lossless (sequential)"); break;
      case 0xFFC8: this.setTagDsc(sofn, "JPG","JPEG Extensions"); break;
      case 0xFFC9: this.setTagDsc(sofn, "SOF9","Start of Frame 9	Extended sequential DCT, Arithmetic coding"); break;
      case 0xFFCA: this.setTagDsc(sofn, "SOF10","Start of Frame 10 Progressive DCT, Arithmetic coding"); break;
      case 0xFFCB: this.setTagDsc(sofn, "SOF11","Start of Frame 11 Lossless (sequential), Arithmetic coding"); break;
      case 0xFFCC: this.setTagDsc(sofn, "DAC","Define Arithmetic Coding"); break;
      case 0xFFCD: this.setTagDsc(sofn, "SOF13","Start of Frame 13 Differential sequential DCT, Arithmetic coding"); break;
      case 0xFFCE: this.setTagDsc(sofn, "SOF14","Start of Frame 14 Differential progressive DCT, Arithmetic coding"); break;
      case 0xFFCF: this.setTagDsc(sofn, "SOF15","Start of Frame 15 Differential lossless (sequential), Arithmetic coding"); break;
      default: this.setTagDsc(sofn, m.id,"Invalid id"); return sofn;
    }
    sofn.offset = m.offset;
    sofn.id = m.id;
    sofn.size = r.readUInt16();
    let off = r.offset;
    sofn.samplePrecision = r.readUInt8();
    sofn.nlines = r.readUInt16();
    sofn.samplesperline = r.readUInt16();
    sofn.componentsinframe = r.readUInt8();
    sofn.dctFrames = [];
    for (let i = 0 ; i < sofn.componentsinframe ; i++){
      sofn.dctFrames.push(this.dct_frame(r));
    }
    return sofn;
  },
  dct_frame: function(r){
    let dct = {};
    dct.id = r.readUInt8(),
    r.readUInt4(dct, "verticalSampleFactor", "horizontalSampleFactor");
    dct.quantizationTableDestSelector = r.readUInt8();
    return dct;
  },
  RSTn: function(r, m){
    return {
      tag: 'RST' + (m.id & 0x0f),
      dsc: 'Restart Marker ' + (m.id & 0x0f),
      id: m.id,
      offset: m.offset
    }
  },
  DQT: function(r, m){
    let dqt = {
      tag: "DQT",
      dsc: "Define Quantization Table",
      id: m.id,
      offset: m.offset,
      size: r.readUInt16(),
    }
    r.readUInt4(dqt, "identifier", "precision");
    dqt.table = r.readUInt8Array(64);
    return dqt;
  },
  APP0: function(r, m){
    this.APPn(r,m);
    let tag = r.readString(4);
    r.skip(1);
    m.tag += ": " + tag;
    switch(tag){
      case 'JFIF': return this.JFIF(r,m);
      case 'JFXX': return this.JFXX(r,m);
    }
    r.offset = m.offset + m.size;
    return m;
  },
  APP1: function(r,m){
    // Application Segment 1	EXIF Metadata, TIFF IFD format, JPEG Thumbnail (160×120),  Adobe XMP
    this.APPn(r, m);
    let tag = r.readString(4);
    m.tag += ": " + tag;
    r.skip(2);
    switch (tag) {
      case "Exif": return this.Exif(r, m);
      case "TIFF": return this.TIFF(r, m);
      case "XMP": return this.XMP(m);
    }
    r.offset = m.offset + m.size;
    return m;
  },
  APPn: function(r, m){
    let segn = m.id & 0x0f;
    m.tag = "APP" + segn;
    m.dsc = "Application Segment " + segn;
    m.size = r.readUInt16();   
    
    if (m.id < 0xffe2) // skip APP0 & APP1
      return m;

    switch (m.id) {
      case 0xffe2: // ICC color profile, FlashPix
        m.tag += ": " + r.readString(4);
        if (m.tag.match("ICC"))
          return this.ICC(r, m);
        return m;
      case 0xffe3: m.dsc = "JPS Tag for Stereoscopic JPEG images"; break;
      case 0xffe6: m.dsc = "NITF Lossles profile"; break
    }
    r.offset = m.offset + m.size;
    return m;
  },
  JPGn: function(r, m){
    let n = m.id & 0x0f;
    return {
      tag: 'JPG' + n,
      dsc: 'JPEG Extension ' + n,
      id: m.id,
      offset: m.offset,
      size: m.size
    }
  },
  JFIF: function(r, m){
    r.addUInt8(m, "versionMajor","versionMinor","units")
    r.addUInt16(m, "xDensity", "yDensity");
    r.addUInt8(m, "xThumbnail", "yThumbnail");
    m.thumbnailData = {
      offset: r.offset,
      size: 3 * m.xThumbnail * m.yThumbnail
    };
    r.offset = m.offset + m.size;
    return m;
  },
  JFXX: function(r, m){
    m.extensionCode = r.readUInt8();
    m.thumbnailData = {
      offset: r.offset,
      size: m.size + (r.offset - m.offset)
    };
    r.offset = m.offset + m.size;
    return m;
  },
  XMP: function(r, m){
    return m;
  },
  ICC: function(r,m){
    return m;
  },
  Exif: function(r, m){
    let nativeLE = r.le;
    let exifOffset = r.offset;
    m.TIFF_HEADER = this.TIFF_HEADER(r);
    m.TIFF_HEADER.strEnd = r.strHex(m.TIFF_HEADER.endianness);
    m.TIFF_HEADER.strSign = r.strHex(m.TIFF_HEADER.signature);
    if (m.TIFF_HEADER.signature != 0x002a){
      m.TIFF_HEADER.signature += " (invalid signature)";
      r.le = nativeLE;
      return m;
    }
    this.addIFD(r, m, 0, exifOffset, m.TIFF_HEADER.ifd0_offset);
    r.le = nativeLE;
    return m;
  },
  ifdFormatStr: [ "error", "uInt8","String","uInt16","uInt32","uRational","sInt8","undef","sInt16","sInt32","sRational" ],
  addIFD: function(r, root, index, startOffset, offset){
    r.pushOffset(startOffset + offset);
    let out = {
      count: r.readUInt16(),
      nextOffset: 0
    };
    if (!r.checkOffset(offset + out.count * 12)){
      r.popOffset();
      return;
    }
    for (let i = 0; i < out.count; i++){
      let e = {
        tag: r.readUInt16(),
        format: r.readUInt16(),
        ncomponents: r.readUInt32(),
        value: r.readUInt32()
      };
      let f = {
        ".data" : {
          tag: r.strHex(e.tag),
          format: this.ifdFormatStr[e.format] + (e.ncomponents > 1 ? " array" : ""),
          components: e.ncomponents,
          value: r.strHex(e.value)
        }
      };
      switch (e.tag){
        case 0x8825: this.addIFDSubTable(r, root, e, startOffset, "GPS"); break;
        case 0x8769: this.addIFDSubTable(r, root, e, startOffset, "Exif"); break;
        case 0x014a: this.addIFDSubTable(r, out, e, startOffset, "SubIFD"); break;
        case 0x0190: this.addIFDSubTable(r, out, e, startOffset, "GlobalParametersIFD"); break;
        case 0x4748: this.addIFDSubTable(r, out, e, startOffset, "StitchInfo"); break;
        case 0x8290: this.addIFDSubTable(r, out, e, startOffset, "KodakIFD"); break;
        case 0x888a: this.addIFDSubTable(r, out, e, startOffset, "LeafSubIFD"); break;
        case 0xa005: this.addIFDSubTable(r, out, e, startOffset, "InteropOffset"); break;
        case 0xc7d5: this.addIFDSubTable(r, out, e, startOffset, "NikonNEFInfo"); break;
        case 0xfe00: this.addIFDSubTable(r, out, e, startOffset, "KDC_IFD"); break;
      }
      js_ifd.format(r, f, e, startOffset);
      if (typeof f.value === 'object')
        out[f.tag] = f;
      else
        out[f.tag+"|"+f.value] = f;
    }
    out.nextOffset = r.readUInt32();
    root["IFD" + index] = out;

    if (out.nextOffset > 0)
      this.addIFD(r, root, index + 1, startOffset, out.nextOffset);
    
    r.popOffset();
  },

  addIFDSubTable: function(r, root, ifd, startOffset, name){
    this.addIFD(r, root, name, startOffset, ifd.value);
  },

  TIFF_HEADER: function(r){
    let byteOrder = r.readInt16();
    r.le = byteOrder == 0x4949;
    let tiff_header = {
      endianness: byteOrder,
      signature: r.readUInt16(),
      ifd0_offset: r.readUInt32()
    };
    return tiff_header;
  },

  ifdEntry: function(r){
    let out = {
      arraySize: r.readUInt16(),
      interopArray: []
    };
    for (let i = 0; i < out.arraySize; i++){
      out.interopArray.push({
        tag: r.readUInt16(),
        format: r.readUInt16(),
        ncomponents: r.readUInt32(),
        value: r.readUInt32()
      });
    }
    out.nextOffset = r.readUInt32();
    return out;
  },
  IFD0: function(r, i){
    let ifd = this.ifdEntry(r);
    switch (ifd.tag){
      case 0x8825: this.setSubtable(r, ifd, "GPS"); break;
      case 0x8769: this.setSubtable(r, ifd, "Exif"); break;
      case 0x014a: this.setSubtable(r, ifd, "SubIFD"); break;
      case 0x0190: this.setSubtable(r, ifd, "GlobalParametersIFD"); break;
      case 0x4748: this.setSubtable(r, ifd, "StitchInfo"); break;
      case 0x8290: this.setSubtable(r, ifd, "KodakIFD"); break;
      case 0x888a: this.setSubtable(r, ifd, "LeafSubIFD"); break;
      case 0xa005: this.setSubtable(r, ifd, "InteropOffset"); break;
      case 0xc7d5: this.setSubtable(r, ifd, "NikonNEFInfo"); break;
      case 0xfe00: this.setSubtable(r, ifd, "KDC_IFD"); break; 
    }
    ifd.strTag = js_ifd.strTag(r, ifd);
    ifd.strValue = js_ifd.fmtVal(r, ifd);
    return ifd;
  },
  IFD: function(r, offset, id){
    let ifd = {
      id: id,
      offset: offset
    };
    r.pushOffset(offset);
    ifd.entryCount = r.readUInt16();
    ifd.entries = [];
    switch (id){
      case "Exif":
        for (let i = 0 ; i < ifd.entryCount ; i++)
          ifd.entries.push(this.IFDEXIF(r, i));
      case "GPS":
        for (let i = 0 ; i < ifd.entryCount ; i++)
          ifd.entries.push(this.IFDGPS(r, i));
      case "IFD0":
        for (let i = 0 ; i < ifd.entryCount ; i++)
          ifd.entries.push(this.IFD0(r, i));
      default:
        for (let i = 0 ; i < ifd.entryCount ; i++)
          ifd.entries.push(this.IFDn(r, i));
    }
    ifd.nextOffset = r.readUInt32();
    return ifd;
  },
  IFDEXIF: function(r, i){
    let ifd = this.ifdEntry(r,i);
    ifd.tag = js_exif.strTag(ifd);
    ifd.value = js_exif.fmtVal(r, ifd);
    return ifd;
  },
  IFDGPS: function(r, i){
    let ifd = this.ifdEntry(r,i);
    ifd.tag = js_gps.strTag(ifd);
    return ifd;
  },
  
  setSubtable: function(r, ifd, id){
    ifd.strTag = id;
    r.pushOffset();
    ifd[strTag] = this.IFD(r, ifd.value, )
    r.popOffset();
    ifd.strValue = "IFD " + id + " table @+" + r.strHex(ifd.value);
  },
  
  IFDn: function(r, i){
    let ifd = this.ifdEntry(r,i);
    ifd.strTag = js_ifdn.strTag(r, ifd);
    ifd.strValue = js_ifdn.fmtVal(r, ifd);
    return ifd;
  },
  prtIntN: function(r, byteWidth, offval, len, isHex){
    r.pushOffset(offval);
    var arr;
    switch(byteWidth){
      case 16: arr = r.readUInt16Array(len); break;
      case 32: arr = r.readUInt32Array(len); break;      
      case 8:
      default: arr = r.readUInt8Array(len); break;
    }
    r.popOffset();
    var str = "";
    arr.forEach(e => str += r.strHex(e) + " ");
    return str;
  }
}

const js_gps = {
  strTag: function(ifd){
    switch (ifd.tag) {
      case 0x0000: return "GPSVersionID"; //int8u[4]:
      case 0x0001: return "GPSLatitudeRef"; //string[2]
      case 0x0002: return "GPSLatitude"; //rational64u[3]
      case 0x0003: return "GPSLongitudeRef"; //string[2]
      case 0x0004: return "GPSLongitude"; // rational64u[3]
      case 0x0005: return "GPSAltitudeRef"; //int8u
      case 0x0006: return "GPSAltitude"; //rational64u
      case 0x0007: return "GPSTimeStamp"; //rational64u[3]
      case 0x0008: return "GPSSatellites"; //string
      case 0x0009: return "GPSStatus"; //string[2]
      case 0x000a: return "GPSMeasureMode"; //string[2]
      case 0x000b: return "GPSDOP"; //rational64u
      case 0x000c: return "GPSSpeedRef"; //string[2]
      case 0x000d: return "GPSSpeed"; //rational64u
      case 0x000e: return "GPSTrackRef"; //string[2]
      case 0x000f: return "GPSTrack"; //rational64u
      case 0x0010: return "GPSImgDirectionRef"; //string[2]
      case 0x0011: return "GPSImgDirection"; //rational64u
      case 0x0012: return "GPSMapDatum"; //string
      case 0x0013: return "GPSDestLatitudeRef"; //string[2]
      case 0x0014: return "GPSDestLatitude"; //rational64u[3]
      case 0x0015: return "GPSDestLongitudeRef"; //string[2]
      case 0x0016: return "GPSDestLongitude"; //rational64u[3]
      case 0x0017: return "GPSDestBearingRef"; //string[2]
      case 0x0018: return "GPSDestBearing"; //rational64u
      case 0x0019: return "GPSDistDistanceRef"; //string[2]
      case 0x001a: return "GPSDestDistance"; //rational64u
      case 0x001b: return "GPSProcessingMethod"; //undef
      case 0x001c: return "GPSAreaInformation"; //undef
      case 0x001d: return "GPSDateStamp"; //string[11]
      case 0x001e: return "GPSDifferential"; //int16u
      case 0x001f: return "GPSHPositioningError"; //rational64u
    }
    return f_jpeg.fmtUnknownVal(ifd.tag);
  },
}

const js_ifd = {
  format: function(r, o, ifd, ifdOffset){
    o.tag = this.strTag(r, ifd);
    o.value = this.fmtVal(r, ifd, ifdOffset);
    console.log("tag: " + o.tag + " value: " + o.value + " fmt:" + ifd.format);
  },
  defFmt: function(r, ifd, ifdOffset){
    /*
    tag: r.readUInt16(),
    format: r.readUInt16(),
    ncomponents: r.readUInt32(),
    value: r.readUInt32()
     */
    switch(ifd.format){
      case 1: return r.splitUInt8(ifd.value, 32, ifd.ncomponents);
      case 2: return r.readStringAt(ifdOffset + ifd.value, ifd.ncomponents-1);
      case 3: return r.splitUInt16(ifd.value, 32, ifd.ncomponents);
      case 4:
        return ifd.value;
      case 5: return this.rationalAt(r, ifdOffset + ifd.value);
      case 6: return r.splitUInt8(ifd.value, 32, ifd.ncomponents);
      case 7:
        return ifd.value;
      case 8: return r.splitUInt16(ifd.value, 32, ifd.ncomponents);
      case 9:
        return ifd.value;
      case 10: return this.rationalAt(r, ifdOffset + ifd.value);
    }
    return ifd.value;
  },
  rationalAt: function(r, offset){
    r.pushOffset(offset);
    let n = r.readUInt32();
    let d = r.readUInt32();
    r.popOffset();
    return d == 0 ? 0 : n/d;
  },
  strTag: function(r, ifd){
    switch(ifd.tag){
      //case 0x000b: return "ProcessingSoftware";
      case 0x00fe: return "SubfileType";
      case 0x00ff: return "OldSubfileType";
      case 0x0100: return "ImageWidth";
      case 0x0101: return "ImageHeight";
      case 0x0102: return "BitsPerSample";
      case 0x0103: return "Compression";
      case 0x0106: return "PhotometricInterpretation";
      case 0x0107: return "Thresholding";
      case 0x0108: return "CellWidth";
      case 0x0109: return "CellLength";
      case 0x010a: return "FillOrder";
      case 0x010d: return "DocumentName";
      case 0x010e: return "ImageDescription";
      case 0x010f: return "Make";
      case 0x0110: return "Model";
      case 0x0111: return "PreviewImageStart"; //strOffset
      case 0x0112: return "Orientation";
      case 0x0115: return "SamplesPerPixel";
      case 0x0116: return "RowsPerStrip";
      case 0x0117: return "PreviewImageLength";
      case 0x0118: return "MinSampleValue";
      case 0x0119: return "MaxSampleValue";
      case 0x011a: return "XResolution";
      case 0x011b: return "YResolution";
      case 0x011c: return "PlanarConfiguration";
      case 0x011d: return "PageName";
      case 0x011e: return "XPosition";
      case 0x011f: return "YPosition";
      case 0x0122: return "GrayResponseUnit";
      case 0x0128: return "ResolutionUnit";
      case 0x0129: return "PageNumber"; //strOffset
      case 0x012d: return "TransferFunction";
      case 0x0131: return "Software";
      case 0x0132: return "ModifyDate";
      case 0x013b: return "Artist";
      case 0x013c: return "HostComputer";
      case 0x013d: return "Predictor";
      case 0x013e: return "WhitePoint"; //strOffset
      case 0x013f: return "PrimaryChromaticities"; //strOffset
      case 0x0141: return "HalftoneHints"; //strOffset
      case 0x0142: return "TileWidth";
      case 0x0143: return "TileLength";
      case 0x014c: return "InkSet";
      case 0x0151: return "TargetPrinter";
      case 0x0201: return "ThumbnailOffset";
      case 0x0202: return "ThumbnailLength";
      case 0x0211: return "YCbCrCoefficients"; //strOffset
      case 0x0212: return "YCbCrSubSampling"; //strOffset
      case 0x0213: return "YCbCrPositioning";
      case 0x0214: return "ReferenceBlackWhite"; //strOffset
      case 0x02bc: return "ApplicationNotes";
      case 0x4746: return "Rating";
      case 0x4749: return "RatingPercent";
      case 0x8298: return "Copyright";
      case 0x830e: return "PixelScale"; //strOffset
      case 0x83bb: return "IPTC-NAA";
      case 0x8480: return "IntergraphMatrix"; //strOffset
      case 0x8482: return "ModelTiePoint"; //strOffset
      case 0x8546: return "SEMInfo";
      case 0x85d8: return "ModelTransform"; //strOffset
      case 0x8649: return "PhotoshopSettings"; //strOffset
      case 0x8773: return "ICC_Profile"; //strOffset
      case 0x87af: return "GeoTiffDirectory"; //strOffset
      case 0x87b0: return "GeoTiffDoubleParams";
      case 0x87b1: return "GeoTiffAsciiParams";
      case 0x935c: return "ImageSourceData"; //strOffset
      case 0x9c9b: return "XPTitle";
      case 0x9c9c: return "XPComment";
      case 0x9c9d: return "XPAuthor";
      case 0x9c9e: return "XPKeywords";
      case 0x9c9f: return "XPSubject";
      case 0xa480: return "GDALMetadata";
      case 0xa481: return "GDALNoData";
      case 0xc4a5: return "PrintIM"; //strOffset
      case 0xc612: return "DNGVersion"; //strOffset
      case 0xc613: return "DNGBackwardVersion"; //strOffset
      case 0xc614: return "UniqueCameraModel";
      case 0xc615: return "LocalizedCameraModel";
      case 0xc621: return "ColorMatrix1"; //strOffset
      case 0xc622: return "ColorMatrix2"; //strOffset
      case 0xc623: return "CameraCalibration1"; //strOffset
      case 0xc624: return "CameraCalibration2"; //strOffset
      case 0xc625: return "ReductionMatrix1"; //strOffset
      case 0xc626: return "ReductionMatrix2"; //strOffset
      case 0xc627: return "AnalogBalance"; //strOffset
      case 0xc628: return "AsShotNeutral"; //strOffset
      case 0xc629: return "AsShotWhiteXY"; //strOffset
      case 0xc62a: return "BaselineExposure";
      case 0xc62b: return "BaselineNoise";
      case 0xc62c: return "BaselineSharpness";
      case 0xc62e: return "LinearResponseLimit";
      case 0xc62f: return "CameraSerialNumber";
      case 0xc630: return "DNGLensInfo"; //strOffset
      case 0xc633: return "ShadowScale";
      case 0xc634: return "SR2Private"; //strOffset
      case 0xc635: return "MakerNoteSafety";
      case 0xc65a: return "CalibrationIlluminant1";
      case 0xc65b: return "CalibrationIlluminant2";
      case 0xc65d: return "RawDataUniqueID"; //strOffset
      case 0xc68b: return "OriginalRawFileName";
      case 0xc68c: return "OriginalRawFileData"; //strOffset
      case 0xc68f: return "AsShotICCProfile"; //strOffset
      case 0xc690: return "AsShotPreProfileMatrix"; //strOffset
      case 0xc691: return "CurrentICCProfile"; //strOffset
      case 0xc692: return "CurrentPreProfileMatrix"; //strOffset
      case 0xc6bf: return "ColorimetricReference";
      case 0xc6c5: return "SRawType"; //strOffset
      case 0xc6d2: return "PanasonicTitle"; //strOffset
      case 0xc6d3: return "PanasonicTitle2"; //strOffset
      case 0xc6f3: return "CameraCalibrationSig";
      case 0xc6f4: return "ProfileCalibrationSig";
      case 0xc6f5: return "ProfileIFD"; //strOffset
      case 0xc6f6: return "AsShotProfileName";
      case 0xc6f8: return "ProfileName";
      case 0xc6f9: return "ProfileHueSatMapDims"; //strOffset
      case 0xc6fa: return "ProfileHueSatMapData1"; //strOffset
      case 0xc6fb: return "ProfileHueSatMapData2"; //strOffset
      case 0xc6fc: return "ProfileToneCurve"; //strOffset
      case 0xc6fd: return "ProfileEmbedPolicy";
      case 0xc6fe: return "ProfileCopyright";
      case 0xc714: return "ForwardMatrix1"; //strOffset
      case 0xc715: return "ForwardMatrix2"; //strOffset
      case 0xc716: return "PreviewApplicationName";
      case 0xc717: return "PreviewApplicationVersion";
      case 0xc718: return "PreviewSettingsName";
      case 0xc719: return "PreviewSettingsDigest";
      case 0xc71a: return "PreviewColorSpace";
      case 0xc71b: return "PreviewDateTime";
      case 0xc71c: return "RawImageDigest"; //strOffset
      case 0xc71d: return "OriginalRawFileDigest"; //strOffset
      case 0xc725: return "ProfileLookTableDims"; //strOffset
      case 0xc726: return "ProfileLookTableData"; //strOffset
      case 0xc763: return "TimeCodes"; //strOffset
      case 0xc764: return "FrameRate";
      case 0xc772: return "TStop"; //strOffset
      case 0xc789: return "ReelName";
      case 0xc791: return "OriginalDefaultFinalSize"; //strOffset
      case 0xc792: return "OriginalBestQualitySize"; //strOffset
      case 0xc793: return "OriginalDefaultCropSize"; //strOffset
      case 0xc7a1: return "CameraLabel";
      case 0xc7a3: return "ProfileHueSatMapEncoding";
      case 0xc7a4: return "ProfileLookTableEncoding";
      case 0xc7a5: return "BaselineExposureOffset";
      case 0xc7a6: return "DefaultBlackRender";
      case 0xc7a7: return "NewRawImageDigest"; //strOffset
      case 0xc7a8: return "RawToPreviewGain"; //strOffset
      case 0xc7e9: return "DepthFormat";
      case 0xc7ea: return "DepthNear";
      case 0xc7eb: return "DepthFar";
      case 0xc7ec: return "DepthUnits";
      case 0xc7ed: return "DepthMeasureType";
      case 0xc7ee: return "EnhanceParams";
      //---------------- EXIF
      case 0x0000: return "GPSVersionID"; //int8u[4]:
      case 0x0001: return "GPSLatitudeRef"; //string[2]
      case 0x0002: return "GPSLatitude"; //rational64u[3]
      case 0x0003: return "GPSLongitudeRef"; //string[2]
      case 0x0004: return "GPSLongitude"; // rational64u[3]
      case 0x0005: return "GPSAltitudeRef"; //int8u
      case 0x0006: return "GPSAltitude"; //rational64u
      case 0x0007: return "GPSTimeStamp"; //rational64u[3]
      case 0x0008: return "GPSSatellites"; //string
      case 0x0009: return "GPSStatus"; //string[2]
      case 0x000a: return "GPSMeasureMode"; //string[2]
      case 0x000b: return "GPSDOP"; //rational64u
      case 0x000c: return "GPSSpeedRef"; //string[2]
      case 0x000d: return "GPSSpeed"; //rational64u
      case 0x000e: return "GPSTrackRef"; //string[2]
      case 0x000f: return "GPSTrack"; //rational64u
      case 0x0010: return "GPSImgDirectionRef"; //string[2]
      case 0x0011: return "GPSImgDirection"; //rational64u
      case 0x0012: return "GPSMapDatum"; //string
      case 0x0013: return "GPSDestLatitudeRef"; //string[2]
      case 0x0014: return "GPSDestLatitude"; //rational64u[3]
      case 0x0015: return "GPSDestLongitudeRef"; //string[2]
      case 0x0016: return "GPSDestLongitude"; //rational64u[3]
      case 0x0017: return "GPSDestBearingRef"; //string[2]
      case 0x0018: return "GPSDestBearing"; //rational64u
      case 0x0019: return "GPSDistDistanceRef"; //string[2]
      case 0x001a: return "GPSDestDistance"; //rational64u
      case 0x001b: return "GPSProcessingMethod"; //undef
      case 0x001c: return "GPSAreaInformation"; //undef
      case 0x001d: return "GPSDateStamp"; //string[11]
      case 0x001e: return "GPSDifferential"; //int16u
      case 0x001f: return "GPSHPositioningError"; //rational64u
      
      case 0x1000: return "RelatedImageFileFormat";
      case 0x1001: return "RelatedImageWidth";
      case 0x1002: return "RelatedImageHeight";
      case 0x829a: return "ExposureTime";
      case 0x829d: return "FNumber";
      case 0x8822: return "ExposureProgram";
      case 0x8824: return "SpectralSensitivity";
      case 0x8827: return "ISO";
      case 0x882a: return "TimeZoneOffset";
      case 0x882b: return "SelfTimerMode";
      case 0x8830: return "SensitivityType";
      case 0x8831: return "StandardOutputSensitivity";
      case 0x8832: return "RecommendedExposureIndex";
      case 0x8833: return "ISOSpeed";
      case 0x8834: return "ISOSpeedLatitudeyyy";
      case 0x8835: return "ISOSpeedLatitudezzz";
      case 0x9000: return "ExifVersion";
      case 0x9003: return "DateTimeOriginal";
      case 0x9004: return "CreateDate";
      case 0x9009: return "GooglePlusUploadCode";
      case 0x9010: return "OffsetTime";
      case 0x9011: return "OffsetTimeOriginal";
      case 0x9012: return "OffsetTimeDigitized";
      case 0x9101: return "ComponentsConfiguration";
      case 0x9102: return "CompressedBitsPerPixel";
      case 0x9201: return "ShutterSpeedValue";
      case 0x9202: return "ApertureValue";
      case 0x9203: return "BrightnessValue";
      case 0x9204: return "ExposureCompensation";
      case 0x9205: return "MaxApertureValue";
      case 0x9206: return "SubjectDistance";
      case 0x9207: return "MeteringMode";
      case 0x9208: return "LightSource";
      case 0x9209: return "Flash";
      case 0x920a: return "FocalLength";
      case 0x9211: return "ImageNumber";
      case 0x9212: return "SecurityClassification";
      case 0x9213: return "ImageHistory";
      case 0x9214: return "SubjectArea";
      case 0x927c: return "makerNoteProprietary";
      case 0x9286: return "UserComment";
      case 0x9290: return "SubSecTime";
      case 0x9291: return "SubSecTimeOriginal";
      case 0x9292: return "SubSecTimeDigitized";
      case 0x9400: return "AmbientTemperature";
      case 0x9401: return "Humidity";
      case 0x9402: return "Pressure";
      case 0x9403: return "WaterDepth";
      case 0x9404: return "Acceleration";
      case 0x9405: return "CameraElevationAngle";
      case 0x9999: return "Vendor data";
      case 0xa000: return "FlashpixVersion";
      case 0xa001: return "ColorSpace";
      case 0xa002: return "ExifImageWidth";
      case 0xa003: return "ExifImageHeight";
      case 0xa004: return "RelatedSoundFile";
      case 0xa20b: return "FlashEnergy";
      case 0xa20e: return "FocalPlaneXResolution";
      case 0xa20f: return "FocalPlaneYResolution";
      case 0xa210: return "FocalPlaneResolutionUnit";
      case 0xa214: return "SubjectLocation";
      case 0xa215: return "ExposureIndex";
      case 0xa217: return "SensingMethod";
      case 0xa300: return "FileSource";
      case 0xa301: return "SceneType";
      case 0xa302: return "CFAPattern";
      case 0xa401: return "CustomRendered";
      case 0xa402: return "ExposureMode";
      case 0xa403: return "WhiteBalance";
      case 0xa404: return "DigitalZoomRatio";;
      case 0xa405: return "FocalLengthIn35mmFormat";
      case 0xa406: return "SceneCaptureType";
      case 0xa407: return "GainControl";
      case 0xa408: return "Contrast";
      case 0xa409: return "Saturation";
      case 0xa40a: return "Sharpness";
      case 0xa40c: return "SubjectDistanceRange";
      case 0xa420: return "ImageUniqueID";
      case 0xa430: return "OwnerName";
      case 0xa431: return "SerialNumber";
      case 0xa432: return "LensInfo";
      case 0xa433: return "LensMake";
      case 0xa434: return "LensModel";
      case 0xa435: return "LensSerialNumber";
      case 0xa460: return "CompositeImage";
      case 0xa461: return "CompositeImageCount";
      case 0xa462: return "CompositeImageExposureTimes";
      case 0xa500: return "Gamma";
      case 0xea1c: return "Padding";
      case 0xea1d: return "OffsetSchema";
      case 0xfde8: return "OwnerName";
      case 0xfde9: return "SerialNumber";
      case 0xfdea: return "Lens";
      case 0xfe4c: return "RawFile";
      case 0xfe4d: return "Converter";
      case 0xfe4e: return "WhiteBalance";
      case 0xfe51: return "Exposure";
      case 0xfe52: return "Shadows";
      case 0xfe53: return "Brightness";
      case 0xfe54: return "Contrast";
      case 0xfe55: return "Saturation";
      case 0xfe56: return "Sharpness";
      case 0xfe57: return "Smoothness";
      case 0xfe58: return "MoireFilter";
    }
    return f_jpeg.fmtUnknownVal(ifd.tag);
  },
  fmtVal: function(r, ifd, ifdOffset){
    let v = this.defFmt(r, ifd, ifdOffset);
    switch(ifd.tag){
      case 0x00fe: return this.subfileType(v);
      case 0x00ff: return this.oldSubfileType(v);
      case 0x0103: return this.compression(v);
      case 0x0106: return this.photometricInterpretation(v);
      case 0x0107: return this.thresholding(v);
      case 0x010a: return this.fillOrder(v);
      case 0x0112: return this.orientation(v);
      case 0x011c: return this.planarConfiguration(v);
      case 0x0122: return this.grayResponseUnit(v);
      case 0x0128: return this.resolutionUnit(v);
      case 0x0213: return this.YCbCrPositioning(v);
      case 0x8822: return this.exposureProgram(v);
      case 0x9101: return this.componentsConfiguration(v);
      case 0x9207: return this.meteringMode(v);
      case 0x9208: return this.lightSource(v);
      case 0x9209: return this.flash(v);
      case 0x9999: return JSON.parse(v);
      case 0xa001: return this.colorSpace(v); // ColorSpace
      case 0xa217: return this.sensingMethod(v); // SensingMethod
      case 0xa301: return v != 0 ? "Directly photographed" : f_jpeg.fmtUnknownVal(v);
      case 0xa401: return this.customRendered(v);// CustomRendered
      case 0xa402: return this.exposureMode(v); // ExposureMode
      case 0xa403: return this.whiteBalance(v); // WhiteBalance
      case 0xa406: return this.sceneCaptureType(v); // SceneCaptureType
      case 0xa407: return this.gainControl(v); // GainControl
      case 0xa408: return this.contrast(v); // Contrast
      case 0xa409: return this.saturation(v); // Saturation
      case 0xa40a: return this.sharpness(v); // Sharpness
      case 0xa40c: return this.subjectDistanceRange(v); // SubjectDistanceRange
      case 0xa460: return this.compositeImage(v); // CompositeImage
    }
    return v;
  },
  //#region ifd_listValues
  subfileType: function(val){
    if (val == 0xffffffff)
      return "invalid";
    else if (val == 0x10001)
      return "Alternate reduced-resolution image";
    switch(val & 0xf){
      case 0x0: return "Full-resolution image";
      case 0x1: return "Reduced-resolution image";
      case 0x2: return "Single page of multi-page image";
      case 0x3: return "Single page of multi-page reduced-resolution image";
      case 0x4: return "Transparency mask";
      case 0x5: return "Transparency mask of reduced-resolution image";
      case 0x6: return "Transparency mask of multi-page image";
      case 0x7: return "Transparency mask of reduced-resolution multi-page image";
      case 0x8: return "Depth map";
      case 0x9: return "Depth map of reduced-resolution image";
      case 0x10: return "Enhanced image data";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  oldSubfileType: function(val){
    switch (val) {
      case 1: return"Full-resolution image";
      case 2: return "Reduced-resolution image";
      case 3: return "Single page of multi-page image";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  compression: function(val){
    switch (val) {
      case 1	: return "Uncompressed";
      case 2	: return "CCITT 1D";
      case 3	: return "T4/Group 3 Fax";
      case 4	: return "T6/Group 4 Fax";
      case 5	: return "LZW";
      case 6	: return "JPEG (old-style)";
      case 7	: return "JPEG";
      case 8	: return "Adobe Deflate";
      case 9	: return "JBIG B&W";
      case 10	: return "JBIG Color";
      case 99	: return "JPEG";
      case 262	: return "Kodak 262";
      case 32766	: return "Next";
      case 32767	: return "Sony ARW Compressed";
      case 32769	: return "Packed RAW";
      case 32770	: return "Samsung SRW Compressed";
      case 32771	: return "CCIRLEW";
      case 32772	: return "Samsung SRW Compressed 2";
      case 32773	: return "PackBits";
      case 32809	: return "Thunderscan";
      case 32867	: return "Kodak KDC Compressed";
      case 32895	: return "IT8CTPAD";
      case 32896	: return "IT8LW";
      case 32897	: return "IT8MP";
      case 32898	: return "IT8BL";
      case 32908	: return "PixarFilm";
      case 32909	: return "PixarLog";
      case 32946	: return "Deflate";
      case 32947	: return "DCS";
      case 33003	: return "Aperio JPEG 2000 YCbCr";
      case 33005	: return "Aperio JPEG 2000 RGB";
      case 34661	: return "JBIG";
      case 34676	: return "SGILog";
      case 34677	: return "SGILog24";
      case 34712	: return "JPEG 2000";
      case 34713	: return "Nikon NEF Compressed";
      case 34715	: return "JBIG2 TIFF FX";
      case 34718	: return "Microsoft Document Imaging (MDI) Binary Level Codec";
      case 34719	: return "Microsoft Document Imaging (MDI) Progressive Transform Codec";
      case 34720	: return "Microsoft Document Imaging (MDI) Vector";
      case 34887	: return "ESRI Lerc";
      case 34892	: return "Lossy JPEG";
      case 34925	: return "LZMA2";
      case 34926	: return "Zstd";
      case 34927	: return "WebP";
      case 34933	: return "PNG";
      case 34934	: return "JPEG XR";
      case 65000	: return "Kodak DCR Compressed";
      case 65535	: return "Pentax PEF Compressed";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  photometricInterpretation: function(val){
    switch (val){
      case 0: return "WhiteIsZero";
      case 1: return "BlackIsZero";
      case 2: return "RGB";
      case 3: return "RGB Palette";
      case 4: return "Transparency Mask";
      case 5: return "CMYK";
      case 6: return "YCbCr";
      case 8: return "CIELab";
      case 9: return "ICCLab";
      case 10: return "ITULab";
      case 32803: return "Color Filter Array";
      case 32844: return "Pixar LogL";
      case 32845: return "Pixar LogLuv";
      case 32892: return "Sequential Color Filter";
      case 34892: return "Linear Raw";
      case 51177: return "Depth Map";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  thresholding: function(val){
    switch (val) {
      case 1: return "No dithering or halftoning";
      case 2: return "Ordered dither or halftone";
      case 3: return "Randomized dither";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  fillOrder: function(val){
    switch(val){
      case 1: return "Normal";
      case 2: return "Reversed";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  orientation: function(val){
    switch (val){
      case 1: return "Horizontal";
      case 2: return "Flip horizontal";
      case 3: return "Rotate 180º";
      case 4: return "Flip vertical";
      case 5: return "Flip horizontal, -90º";
      case 6: return "Rotate +90º";
      case 7: return "Flip horizontal, +90º";
      case 8: return "Rotate -90º";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  planarConfiguration: function(val){
    switch(val){
      case 1: return "Chunky";
      case 2: return "Planar";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  grayResponseUnit: function(val){
    switch(val){
      case 1: return "0.1";
      case 2: return "0.001";
      case 3: return "0.0001";
      case 4: return "1e-05";
      case 5: return "1e-06";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  resolutionUnit: function(val){
    switch (val) {
      case 1: return "None";
      case 2: return "inches";
      case 3: return "cm";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  YCbCrSubSampling: function(value){
    return "YCbCr4:2:" + value[1] === 2 ? "0" : "2";
    /*
    let v = (value & 0x7) << 3 | (value & 0x0700) >> 8;
    switch (v) {
      case 0b001001: return "YCbCr4:4:4";
      case 0b001010: return "YCbCr4:4:0";
      case 0b001100: return "YCbCr4:4:1";
      case 0b010001: return "YCbCr4:2:2";
      case 0b010010: return "YCbCr4:2:0";
      case 0b010100: return "YCbCr4:2:1";
      case 0b100001: return "YCbCr4:1:1";
      case 0b100010: return "YCbCr4:1:0";
    }
    return f_jpeg.fmtUnknownVal(v);
    */
  },
  YCbCrPositioning: function(value){
    switch (value) {
      case 1: return "centered";
      case 2: return "co-sited";
    }
    return f_jpeg.fmtUnknownVal(v);
  },
  sampleFormat: function(val){
    switch(val){
      case 1: return "Unsigned"; // unsigned integer
      case 2: return "Signed"; // two's complement signed integer
      case 3: return "Float"; // IEEE floating point
      case 4: return "Undefined";
      case 5: return "Complex int"; // complex integer (ref 3)
      case 6: return "Complex float"; // complex IEEE floating point (ref 3)
    }
    return f_jpeg.fmtUnknownVal(v);
  },

  // EXIF

  exposureProgram: function(val){
    switch (val) {
      case 1: return "Manual";
      case 2: return "Program AE";
      case 3: return "Aperture-priority AE";
      case 4: return "Shutter speed priority AE";
      case 5: return "Creative (Slow speed)";
      case 6: return "Action (High speed)";
      case 7: return "Portrait";
      case 8: return "Landscape";
      case 9: return "Bulb";
      case 0: return "Not Defined";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  lightSource: function(val){
    switch(val){
      case 0: return "Unknown";
      case 1: return "Daylight";
      case 2: return "Fluorescent";
      case 3: return "Tungsten (Incandescent)";
      case 4: return "Flash";
      case 9: return "Fine Weather";
      case 10: return "Cloudy";
      case 11: return "Shade";
      case 12: return "Daylight Fluorescent";
      case 13: return "Day White Fluorescent";
      case 14: return "Cool White Fluorescent";
      case 15: return "White Fluorescent";
      case 16: return "Warm White Fluorescent";
      case 17: return "Standard Light A";
      case 18: return "Standard Light B";
      case 19: return "Standard Light C";
      case 20: return "D55";
      case 21: return "D65";
      case 22: return "D75";
      case 23: return "D50";
      case 24: return "ISO Studio Tungsten";
      case 255: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  flash: function(val){
    switch(val){
      case 0x0: return "No Flash";
      case 0x1: return "Fired";
      case 0x5: return "Fired, return not detected";
      case 0x7: return "Fired, return detected";
      case 0x8: return "On, Did not fire";
      case 0x9: return "On, Fired";
      case 0xd: return "On, return not detected";
      case 0xf: return "On, return  detected";
      case 0x10: return "Off, Did not fire";
      case 0x14: return "Off, Did not fire, return not detected";
      case 0x18: return "Auto, Did not fire";
      case 0x19: return "Auto, Fired";
      case 0x1d: return "Auto, Fired, return not detected";
      case 0x1f: return "Auto, Fired, return detected";
      case 0x20: return "No flash function";
      case 0x30: return "Off, No flash function";
      case 0x41: return "Fired, Red-eye reduction";
      case 0x45: return "Fired, Red-eye reduction, return not detected";
      case 0x47: return "Fired, Red-eye reduction, return detected";
      case 0x49: return "On, Red-eye reduction";
      case 0x4d: return "On, Red-eye reduction, return not detected";
      case 0x4f: return "On, Red-eye reduction, return detected";
      case 0x50: return "Off, Red-eye reduction";
      case 0x58: return "Auto, Did not fire, Red-eye reduction";
      case 0x59: return "Auto, Fired, Red-eye reduction";
      case 0x5d: return "Auto, Fired, Red-eye reduction, return not detected";
      case 0x5f: return "Auto, Fired, Red-eye reduction, return detected";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  components: [ "-","Y","Cb","Cr","B","G","R" ], 
  componentsConfiguration: function(val){
    var id;
    var out;
    for (let i = 0; i < 4; i++){
      out += this.components[(val >> i) & 0x7];
    }
    return out;
  },

  meteringMode: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Average";
      case 2: return "Center-weighted average";
      case 3: return "Spot";
      case 4: return "Multi-spot";
      case 5: return "Multi-segment";
      case 6: return "Partial";
      case 255: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  colorSpace: function(val){
    switch (val) {
      case 0x0001: return "sRGB";
      case 0x0002: return "Adobe RGB";
      case 0xfffd: return "Wide Gamut RGB";
      case 0xfffe: return "ICC Profile";
      case 0xffff: return "Uncalibrated";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sensingMethod: function(val){
    switch (val) {
      case 1: return "Not defined";
      case 2: return "One-chip color area";
      case 3: return "Two-chip color area";
      case 4: return "Three-chip color area";
      case 5: return "Color sequential area";
      case 7: return "Trilinear";
      case 8: return "Color sequential linear";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  customRendered: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Custom";
      case 2: return "HDR (no original saved)";
      case 3: return "HDR (original saved)";
      case 4: return "Original (for HDR)";
      case 5: return "cm";
      case 6: return "Panorama";
      case 7: return "Portrait HDR";
      case 8: return "Portrait";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  compositeImage: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Not a Composite Image";
      case 2: return "General Composite Image";
      case 3: return "Composite Image Captured While Shooting";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  subjectDistanceRange: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Macro";
      case 2: return "Close";
      case 3: return "Distant";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  exposureMode: function(val){
    switch (val) {
      case 0:  return "Auto";
      case 1:  return "Manual";
      case 2:  return "Auto bracket";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  whiteBalance: function(val){
    switch (val) {
      case 0: return "Auto";
      case 1: return "Manual";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sceneCaptureType: function(val){
    switch (val) {
      case 0: return "Standard";
      case 1: return "Landscape";
      case 2: return "Portrait";
      case 3: return "Night";
      case 4: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  gainControl: function(val){
    switch (val) {
      case 0: return "None";
      case 1: return "Low gain up";
      case 2: return "High gain up";
      case 3: return "Low gain down";
      case 4: return "High gain down";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  contrast: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Low";
      case 2: return "High";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  saturation: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Low";
      case 2: return "High";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sharpness: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Soft";
      case 2: return "Hard";
    }
    f_jpeg.fmtUnknownVal(val);
  }
  //#endregion
}

const js_ifdn = {
  fmtVal: function(r, ifd){
    switch(ifd.tag){
    case 0x0103: return js_ifd.compression(value);
    case 0x0128: return js_ifd.resolutionUnit(value);
    case 0x0128: return js_ifd.resolutionUnit(value);
    case 0x0124: return this.T4Options(ifd);
    case 0x0125: return this.T6Options(ifd);
    }
    return f_jpeg.fmtUnknownVal(ifd.tag);
  },
  strTag: function(r, ifdn){
    switch (ifdn.tag){
      case 0x0001: strTag = "InteropIndex"; break;
      case 0x0002: strTag = "InteropVersion"; break;
      case 0x1000: strTag = "RelatedImageFileFormat"; break;
      case 0x1001: strTag = "RelatedImageWidth"; break;
      case 0x1002: strTag = "RelatedImageHeight"; break;
      case 0x0100: strTag = "ImageWidth"; break;
      case 0x0101: strTag = "ImageHeight"; break;
      case 0x0102: strTag = "BitsPerSample"; break;
      case 0x0103: strTag = "Compression";
      case 0x011a: pfloat = 1; strTag = "XResolution"; break;
      case 0x011b: pfloat = 1; strTag = "YResolution"; break;
      case 0x0128: strTag = "ResolutionUnit";
      case 0x0111: strTag = "PreviewImageStart"; break;
      case 0x0117: strTag = "PreviewImageLength"; break;
      case 0x0120: strTag = "FreeOffsets"; break;
      case 0x0121: strTag = "FreeByteCounts"; break;
      case 0x0123: strTag = "GrayResponseCurve"; break;
      case 0x0124: strTag = "T4Options";
      case 0x0125: strTag = "T6Options";
      case 0x012c: strTag = "ColorResponseUnit"; break;
      case 0x0140: strTag = "ColorMap"; break;
      case 0x0144: strTag = "TileOffsets"; break;
      case 0x0145: strTag = "TileByteCounts"; break;
      case 0x0146: strTag = "BadFaxLines"; break;
      case 0x0147: strTag = "CleanFaxData"; break;
      case 0x0148: strTag = "ConsecutiveBadFaxLines"; break;
      case 0x014d: strTag = "InkNames"; break;
      case 0x014e: strTag = "NumberofInks"; break;
      case 0x0150: strTag = "DotRange"; break;
      case 0x0152: strTag = "ExtraSamples"; break;
      case 0x0153: strTag = "SampleFormat"; break;// SampleFormat
      case 0x0154: strTag = "SMinSampleValue"; break;
      case 0x0155: strTag = "SMaxSampleValue"; break;
      case 0x0156: strTag = "TransferRange"; break;
      case 0x0157: strTag = "ClipPath"; break;
      case 0x0158: strTag = "XClipPathUnits"; break;
      case 0x0159: strTag = "YClipPathUnits"; break;
      case 0x015a: strTag = "Indexed"; break;
      case 0x015b: strTag = "JPEGTables"; break;
      case 0x015f: strTag = "OPIProxy"; break;
      case 0x0191: strTag = "ProfileType"; break;
      case 0x0192: strTag = "FaxProfile"; break;
      case 0x0193: strTag = "CodingMethods"; break;
      case 0x0194: strTag = "VersionYear"; break;
      case 0x0195: strTag = "ModeNumber"; break;
      case 0x01b1: strTag = "Decode"; break;
      case 0x01b2: strTag = "DefaultImageColor"; break;
      case 0x01b3: strTag = "T82Options"; break;
      case 0x01b5: strTag = "JPEGTables"; break;
      case 0x0200: strTag = "JPEGProc"; break;
      case 0x0201: strTag = "ThumbnailOffset"; break;
      case 0x0202: strTag = "ThumbnailLength"; break;
      case 0x0203: strTag = "JPEGRestartInterval"; break;
      case 0x0205: strTag = "JPEGLosslessPredictors"; break;
      case 0x0206: strTag = "JPEGPointTransforms"; break;
      case 0x0207: strTag = "JPEGQTables"; break;
      case 0x0208: strTag = "JPEGDCTables"; break;
      case 0x0209: strTag = "JPEGACTables"; break;
      case 0x022f: strTag = "StripRowCounts"; break;
      case 0x03e7: strTag = "USPTOMiscellaneous"; break;
      case 0x4747: strTag = "XP_DIP_XML"; break;
      case 0x7000: strTag = "SonyRawFileType"; break;
      case 0x7010: strTag = "SonyToneCurve"; break;
      case 0x7031: strTag = "VignettingCorrection"; break;
      case 0x7032: strTag = "VignettingCorrParams"; break;
      case 0x7034: strTag = "ChromaticAberrationCorrection"; break;
      case 0x7035: strTag = "ChromaticAberrationCorrParams"; break;
      case 0x7036: strTag = "DistortionCorrection"; break;
      case 0x7037: strTag = "DistortionCorrParams"; break;
      case 0x74c7: strTag = "SonyCropTopLeft"; break;
      case 0x74c8: strTag = "SonyCropSize"; break;
      case 0x800d: strTag = "ImageID"; break;
      case 0x80a3: strTag = "WangTag1"; break;
      case 0x80a4: strTag = "WangAnnotation"; break;
      case 0x80a5: strTag = "WangTag3"; break;
      case 0x80a6: strTag = "WangTag4"; break;
      case 0x80b9: strTag = "ImageReferencePoints"; break;
      case 0x80ba: strTag = "RegionXformTackPoint"; break;
      case 0x80bb: strTag = "WarpQuadrilateral"; break;
      case 0x80bc: strTag = "AffineTransformMat"; break;
      case 0x80e3: strTag = "Matteing"; break;
      case 0x80e4: strTag = "DataType"; break;
      case 0x80e5: strTag = "ImageDepth"; break;
      case 0x80e6: strTag = "TileDepth"; break;
      case 0x8214: strTag = "ImageFullWidth"; break;
      case 0x8215: strTag = "ImageFullHeight"; break;
      case 0x8216: strTag = "TextureFormat"; break;
      case 0x8217: strTag = "WrapModes"; break;
      case 0x8218: strTag = "FovCot"; break;
      case 0x8219: strTag = "MatrixWorldToScreen"; break;
      case 0x821a: strTag = "MatrixWorldToCamera"; break;
      case 0x827d: strTag = "Model2"; break;
      case 0x828d: strTag = "CFARepeatPatternDim"; break;
      case 0x828e: strTag = "CFAPattern2"; break;
      case 0x828f: strTag = "BatteryLevel"; break;
      case 0x82a5: strTag = "MDFileTag"; break;
      case 0x82a6: strTag = "MDScalePixel"; break;
      case 0x82a7: strTag = "MDColorTable"; break;
      case 0x82a8: strTag = "MDLabName"; break;
      case 0x82a9: strTag = "MDSampleInfo"; break;
      case 0x82aa: strTag = "MDPrepDate"; break;
      case 0x82ab: strTag = "MDPrepTime"; break;
      case 0x82ac: strTag = "MDFileUnits"; break;
      case 0x8335: strTag = "AdventScale"; break;
      case 0x8336: strTag = "AdventRevision"; break;
      case 0x835c: strTag = "UIC1Tag"; break;
      case 0x835d: strTag = "UIC2Tag"; break;
      case 0x835e: strTag = "UIC3Tag"; break;
      case 0x835f: strTag = "UIC4Tag"; break;
      case 0x847e: strTag = "IntergraphPacketData"; break;
      case 0x847f: strTag = "IntergraphFlagRegisters"; break;
      case 0x8481: strTag = "INGRReserved"; break;
      case 0x84e0: strTag = "Site"; break;
      case 0x84e1: strTag = "ColorSequence"; break;
      case 0x84e2: strTag = "IT8Header"; break;
      case 0x84e3: strTag = "RasterPadding"; break;
      case 0x84e4: strTag = "BitsPerRunLength"; break;
      case 0x84e5: strTag = "BitsPerExtendedRunLength"; break;
      case 0x84e6: strTag = "ColorTable"; break;
      case 0x84e7: strTag = "ImageColorIndicator"; break;
      case 0x84e8: strTag = "BackgroundColorIndicator"; break;
      case 0x84e9: strTag = "ImageColorValue"; break;
      case 0x84ea: strTag = "BackgroundColorValue"; break;
      case 0x84eb: strTag = "PixelIntensityRange"; break;
      case 0x84ec: strTag = "TransparencyIndicator"; break;
      case 0x84ed: strTag = "ColorCharacterization"; break;
      case 0x84ee: strTag = "HCUsage"; break;
      case 0x84ef: strTag = "TrapIndicator"; break;
      case 0x84f0: strTag = "CMYKEquivalent"; break;
      case 0x8568: strTag = "AFCP_IPTC"; break;
      case 0x85b8: strTag = "PixelMagicJBIGOptions"; break;
      case 0x85d7: strTag = "JPLCartoIFD"; break;
      case 0x8602: strTag = "WB_GRGBLevels"; break;
      case 0x8606: strTag = "LeafData"; break;
      case 0x877f: strTag = "TIFF_FXExtensions"; break;
      case 0x8780: strTag = "MultiProfiles"; break;
      case 0x8781: strTag = "SharedData"; break;
      case 0x8782: strTag = "T88Options"; break;
      case 0x87ac: strTag = "ImageLayer"; break;
      case 0x87be: strTag = "JBIGOptions"; break;
      case 0x8828: strTag = "Opto-ElectricConvFactor"; break;
      case 0x8829: strTag = "Interlace"; break;
      case 0x885c: strTag = "FaxRecvParams"; break;
      case 0x885d: strTag = "FaxSubAddress"; break;
      case 0x885e: strTag = "FaxRecvTime"; break;
      case 0x8871: strTag = "FedexEDR"; break;
      case 0x920b: strTag = "FlashEnergy"; break;
      case 0x920c: strTag = "SpatialFrequencyResponse"; break;
      case 0x920d: strTag = "Noise"; break;
      case 0x920e: strTag = "FocalPlaneXResolution"; break;
      case 0x920f: strTag = "FocalPlaneYResolution"; break;
      case 0x9210: strTag = "FocalPlaneResolutionUnit"; break;
      case 0x9215: strTag = "ExposureIndex"; break;
      case 0x9216: strTag = "TIFF-EPStandardID"; break;
      case 0x9217: strTag = "SensingMethod"; break;
      case 0x923a: strTag = "CIP3DataFile"; break;
      case 0x923b: strTag = "CIP3Sheet"; break;
      case 0x923c: strTag = "CIP3Side"; break;
      case 0x923f: strTag = "StoNits"; break;
      case 0x932f: strTag = "MSDocumentText"; break;
      case 0x9330: strTag = "MSPropertySetStorage"; break;
      case 0x9331: strTag = "MSDocumentTextPosition"; break;
      case 0xa010: strTag = "SamsungRawPointersOffset"; break;
      case 0xa011: strTag = "SamsungRawPointersLength"; break;
      case 0xa101: strTag = "SamsungRawByteOrder"; break;
      case 0xa102: strTag = "SamsungRawUnknown?"; break;
      case 0xa20c: strTag = "SpatialFrequencyResponse"; break;
      case 0xa20d: strTag = "Noise"; break;
      case 0xa211: strTag = "ImageNumber"; break;
      case 0xa212: strTag = "SecurityClassification"; break;
      case 0xa213: strTag = "ImageHistory"; break;
      case 0xa216: strTag = "TIFF-EPStandardID"; break;
      case 0xa40b: strTag = "DeviceSettingDescription"; break;
      case 0xafc0: strTag = "ExpandSoftware"; break;
      case 0xafc1: strTag = "ExpandLens"; break;
      case 0xafc2: strTag = "ExpandFilm"; break;
      case 0xafc3: strTag = "ExpandFilterLens"; break;
      case 0xafc4: strTag = "ExpandScanner"; break;
      case 0xafc5: strTag = "ExpandFlashLamp"; break;
      case 0xb4c3: strTag = "HasselbladRawImage"; break;
      case 0xbc01: strTag = "PixelFormat"; break;
      case 0xbc02: strTag = "Transformation"; break;
      case 0xbc03: strTag = "Uncompressed"; break;
      case 0xbc04: strTag = "ImageType"; break;
      case 0xbc80: strTag = "ImageWidth"; break;
      case 0xbc81: strTag = "ImageHeight"; break;
      case 0xbc82: strTag = "WidthResolution"; break;
      case 0xbc83: strTag = "HeightResolution"; break;
      case 0xbcc0: strTag = "ImageOffset"; break;
      case 0xbcc1: strTag = "ImageByteCount"; break;
      case 0xbcc2: strTag = "AlphaOffset"; break;
      case 0xbcc3: strTag = "AlphaByteCount"; break;
      case 0xbcc4: strTag = "ImageDataDiscard"; break;
      case 0xbcc5: strTag = "AlphaDataDiscard"; break;
      case 0xc427: strTag = "OceScanjobDesc"; break;
      case 0xc428: strTag = "OceApplicationSelector"; break;
      case 0xc429: strTag = "OceIDNumber"; break;
      case 0xc42a: strTag = "OceImageLogic"; break;
      case 0xc44f: strTag = "Annotations"; break;
      case 0xc51b: strTag = "HasselbladExif"; break;
      case 0xc573: strTag = "OriginalFileName"; break;
      case 0xc580: strTag = "USPTOOriginalContentType"; break;
      case 0xc5e0: strTag = "CR2CFAPattern"; break;
      case 0xc616: strTag = "CFAPlaneColor"; break;
      case 0xc617: strTag = "CFALayout"; break;
      case 0xc618: strTag = "LinearizationTable"; break;
      case 0xc619: strTag = "BlackLevelRepeatDim"; break;
      case 0xc61a: strTag = "BlackLevel"; break;
      case 0xc61b: strTag = "BlackLevelDeltaH"; break;
      case 0xc61c: strTag = "BlackLevelDeltaV"; break;
      case 0xc61d: strTag = "WhiteLevel"; break;
      case 0xc61e: strTag = "DefaultScale"; break;
      case 0xc61f: strTag = "DefaultCropOrigin"; break;
      case 0xc620: strTag = "DefaultCropSize"; break;
      case 0xc62d: strTag = "BayerGreenSplit"; break;
      case 0xc631: strTag = "ChromaBlurRadius"; break;
      case 0xc632: strTag = "AntiAliasStrength"; break;
      case 0xc640: strTag = "RawImageSegmentation"; break;
      case 0xc65c: strTag = "BestQualityScale"; break;
      case 0xc660: strTag = "AliasLayerMetadata"; break;
      case 0xc68d: strTag = "ActiveArea"; break;
      case 0xc68e: strTag = "MaskedAreas"; break;
      case 0xc6f7: strTag = "NoiseReductionApplied"; break;
      case 0xc71e: strTag = "SubTileBlockSize"; break;
      case 0xc71f: strTag = "RowInterleaveFactor"; break;
      case 0xc740: strTag = "OpcodeList1"; break;
      case 0xc741: strTag = "OpcodeList2"; break;
      case 0xc74e: strTag = "OpcodeList3"; break;
      case 0xc761: strTag = "NoiseProfile"; break;
      case 0xc7aa: strTag = "CacheVersion"; break;
      case 0xc7b5: strTag = "DefaultUserCrop"; break;
    }
    return f_jpeg.fmtUnknownVal(ifdn.tag);
  }
}

const js_exif = {

  format: function(r, o, ifd){
    o.tag = this.strTag(ifd);
    o.value = this.fmtVal(r, ifd);
  },
  defFmt: function(r, ifd){
    /*
    tag: r.readUInt16(),
    format: r.readUInt16(),
    ncomponents: r.readUInt32(),
    value: r.readUInt32()
     */
    switch(ifd.format){
      case 1:
      case 3:
      case 4:
        return ifd.value < 0xffff ? ifd.value : r.strHex(ifd.value);
      case 6:
      case 8:
      case 9:
        return ifd.value;
      case 2: return r.readStringAt(ifd.value, ifd.components - 1);
      case 4: 
        return r.string
    }
    return ifd.value;
  },

  fmtVal: function(r, exifEntry){
    switch(exifEntry.tag){
      case 0x0002: return r.stringOfuint32(exifEntry.value);
      case 0x8822: return this.exposureProgram(exifEntry.value);
      case 0x9000: return r.stringOfuint32(exifEntry.value);
      case 0x9101: return this.componentsConfiguration(exifEntry.value);
      case 0x9207: return this.meteringMode(exifEntry.value);
      case 0x9208: return this.lightSource(exifEntry.value);
      case 0x9209: return this.flash(exifEntry.value);
      case 0x927c: return r.readStringAt(exifEntry.value, exifEntry.ncomponents);
      case 0x9286: return r.readStringAt(exifEntry.value);
      case 0xa000: return r.stringOfuint32(exifEntry.value, false);
      case 0xa001: return this.colorSpace(exifEntry.value); // ColorSpace
      case 0xa217: return this.sensingMethod(exifEntry.value); // SensingMethod
      case 0xa301: return exifEntry.value != 0 ? "Directly photographed" : f_jpeg.fmtUnknownVal(val);
      case 0xa401: return this.customRendered(exifEntry.value);// CustomRendered
      case 0xa402: return this.exposureMode(exifEntry.value); // ExposureMode
      case 0xa403: return this.whiteBalance(exifEntry.value); // WhiteBalance
      case 0xa406: return this.sceneCaptureType(exifEntry.value); // SceneCaptureType
      case 0xa407: return this.gainControl(exifEntry.value); // GainControl
      case 0xa408: return this.contrast(exifEntry.value); // Contrast
      case 0xa409: return this.saturation(exifEntry.value); // Saturation
      case 0xa40a: return this.sharpness(exifEntry.value); // Sharpness
      case 0xa40c: return this.subjectDistanceRange(exifEntry.value); // SubjectDistanceRange
      case 0xa460: return this.compositeImage(exifEntry.value); // CompositeImage
    }
    return this.defFmt(r, exifEntry);
  },

  strTag: function(exif){
    switch(exif.tag){
      case 0x0001: return "InteropIndex";
      case 0x0002: return "InteropVersion";
      case 0x1000: return "RelatedImageFileFormat";
      case 0x1001: return "RelatedImageWidth";
      case 0x1002: return "RelatedImageHeight";
      case 0x829a: return "ExposureTime";
      case 0x829d: return "FNumber";
      case 0x8822: return "ExposureProgram";
      case 0x8824: return "SpectralSensitivity";
      case 0x8827: return "ISO";
      case 0x882a: return "TimeZoneOffset";
      case 0x882b: return "SelfTimerMode";
      case 0x8830: return "SensitivityType";
      case 0x8831: return "StandardOutputSensitivity";
      case 0x8832: return "RecommendedExposureIndex";
      case 0x8833: return "ISOSpeed";
      case 0x8834: return "ISOSpeedLatitudeyyy";
      case 0x8835: return "ISOSpeedLatitudezzz";
      case 0x9000: return "ExifVersion";
      case 0x9003: return "DateTimeOriginal";
      case 0x9004: return "CreateDate";
      case 0x9009: return "GooglePlusUploadCode";
      case 0x9010: return "OffsetTime";
      case 0x9011: return "OffsetTimeOriginal";
      case 0x9012: return "OffsetTimeDigitized";
      case 0x9101: return "ComponentsConfiguration";
      case 0x9102: return "CompressedBitsPerPixel";
      case 0x9201: return "ShutterSpeedValue";
      case 0x9202: return "ApertureValue";
      case 0x9203: return "BrightnessValue";
      case 0x9204: return "ExposureCompensation";
      case 0x9205: return "MaxApertureValue";
      case 0x9206: return "SubjectDistance";
      case 0x9207: return "MeteringMode";
      case 0x9208: return "LightSource";
      case 0x9209: return "Flash";
      case 0x920a: return "FocalLength";
      case 0x9211: return "ImageNumber";
      case 0x9212: return "SecurityClassification";
      case 0x9213: return "ImageHistory";
      case 0x9214: return "SubjectArea";
      case 0x927c: return "makerNoteProprietary";
      case 0x9286: return "UserComment";
      case 0x9290: return "SubSecTime";
      case 0x9291: return "SubSecTimeOriginal";
      case 0x9292: return "SubSecTimeDigitized";
      case 0x9400: return "AmbientTemperature";
      case 0x9401: return "Humidity";
      case 0x9402: return "Pressure";
      case 0x9403: return "WaterDepth";
      case 0x9404: return "Acceleration";
      case 0x9405: return "CameraElevationAngle";
      case 0xa000: return "FlashpixVersion";
      case 0xa001: return "ColorSpace";
      case 0xa002: return "ExifImageWidth";
      case 0xa003: return "ExifImageHeight";
      case 0xa004: return "RelatedSoundFile";
      case 0xa20b: return "FlashEnergy";
      case 0xa20e: return "FocalPlaneXResolution";
      case 0xa20f: return "FocalPlaneYResolution";
      case 0xa210: return "FocalPlaneResolutionUnit";
      case 0xa214: return "SubjectLocation";
      case 0xa215: return "ExposureIndex";
      case 0xa217: return "SensingMethod";
      case 0xa300: return "FileSource";
      case 0xa301: return "SceneType";
      case 0xa302: return "CFAPattern";
      case 0xa401: return "CustomRendered";
      case 0xa402: return "ExposureMode";
      case 0xa403: return "WhiteBalance";
      case 0xa404: return "DigitalZoomRatio";;
      case 0xa405: return "FocalLengthIn35mmFormat";
      case 0xa406: return "SceneCaptureType";
      case 0xa407: return "GainControl";
      case 0xa408: return "Contrast";
      case 0xa409: return "Saturation";
      case 0xa40a: return "Sharpness";
      case 0xa40c: return "SubjectDistanceRange";
      case 0xa420: return "ImageUniqueID";
      case 0xa430: return "OwnerName";
      case 0xa431: return "SerialNumber";
      case 0xa432: return "LensInfo";
      case 0xa433: return "LensMake";
      case 0xa434: return "LensModel";
      case 0xa435: return "LensSerialNumber";
      case 0xa460: return "CompositeImage";
      case 0xa461: return "CompositeImageCount";
      case 0xa462: return "CompositeImageExposureTimes";
      case 0xa500: return "Gamma";
      case 0xea1c: return "Padding";
      case 0xea1d: return "OffsetSchema";
      case 0xfde8: return "OwnerName";
      case 0xfde9: return "SerialNumber";
      case 0xfdea: return "Lens";
      case 0xfe4c: return "RawFile";
      case 0xfe4d: return "Converter";
      case 0xfe4e: return "WhiteBalance";
      case 0xfe51: return "Exposure";
      case 0xfe52: return "Shadows";
      case 0xfe53: return "Brightness";
      case 0xfe54: return "Contrast";
      case 0xfe55: return "Saturation";
      case 0xfe56: return "Sharpness";
      case 0xfe57: return "Smoothness";
      case 0xfe58: return "MoireFilter";
    }
    return f_jpeg.fmtUnknownVal(exif.tag);
  },

  exposureProgram: function(val){
    switch (val) {
      case 1: return "Manual";
      case 2: return "Program AE";
      case 3: return "Aperture-priority AE";
      case 4: return "Shutter speed priority AE";
      case 5: return "Creative (Slow speed)";
      case 6: return "Action (High speed)";
      case 7: return "Portrait";
      case 8: return "Landscape";
      case 9: return "Bulb";
      case 0: return "Not Defined";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  lightSource: function(val){
    switch(val){
      case 0: return "Unknown";
      case 1: return "Daylight";
      case 2: return "Fluorescent";
      case 3: return "Tungsten (Incandescent)";
      case 4: return "Flash";
      case 9: return "Fine Weather";
      case 10: return "Cloudy";
      case 11: return "Shade";
      case 12: return "Daylight Fluorescent";
      case 13: return "Day White Fluorescent";
      case 14: return "Cool White Fluorescent";
      case 15: return "White Fluorescent";
      case 16: return "Warm White Fluorescent";
      case 17: return "Standard Light A";
      case 18: return "Standard Light B";
      case 19: return "Standard Light C";
      case 20: return "D55";
      case 21: return "D65";
      case 22: return "D75";
      case 23: return "D50";
      case 24: return "ISO Studio Tungsten";
      case 255: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  
  exposureProgram: function(val){
    switch (val) {
      case 1: return "Manual";
      case 2: return "Program AE";
      case 3: return "Aperture-priority AE";
      case 4: return "Shutter speed priority AE";
      case 5: return "Creative (Slow speed)";
      case 6: return "Action (High speed)";
      case 7: return "Portrait";
      case 8: return "Landscape";
      case 9: return "Bulb";
      case 0: return "Not Defined";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  lightSource: function(val){
    switch(val){
      case 0: return "Unknown";
      case 1: return "Daylight";
      case 2: return "Fluorescent";
      case 3: return "Tungsten (Incandescent)";
      case 4: return "Flash";
      case 9: return "Fine Weather";
      case 10: return "Cloudy";
      case 11: return "Shade";
      case 12: return "Daylight Fluorescent";
      case 13: return "Day White Fluorescent";
      case 14: return "Cool White Fluorescent";
      case 15: return "White Fluorescent";
      case 16: return "Warm White Fluorescent";
      case 17: return "Standard Light A";
      case 18: return "Standard Light B";
      case 19: return "Standard Light C";
      case 20: return "D55";
      case 21: return "D65";
      case 22: return "D75";
      case 23: return "D50";
      case 24: return "ISO Studio Tungsten";
      case 255: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  flash: function(val){
    switch(val){
      case 0x0: return "No Flash";
      case 0x1: return "Fired";
      case 0x5: return "Fired, return not detected";
      case 0x7: return "Fired, return detected";
      case 0x8: return "On, Did not fire";
      case 0x9: return "On, Fired";
      case 0xd: return "On, return not detected";
      case 0xf: return "On, return  detected";
      case 0x10: return "Off, Did not fire";
      case 0x14: return "Off, Did not fire, return not detected";
      case 0x18: return "Auto, Did not fire";
      case 0x19: return "Auto, Fired";
      case 0x1d: return "Auto, Fired, return not detected";
      case 0x1f: return "Auto, Fired, return detected";
      case 0x20: return "No flash function";
      case 0x30: return "Off, No flash function";
      case 0x41: return "Fired, Red-eye reduction";
      case 0x45: return "Fired, Red-eye reduction, return not detected";
      case 0x47: return "Fired, Red-eye reduction, return detected";
      case 0x49: return "On, Red-eye reduction";
      case 0x4d: return "On, Red-eye reduction, return not detected";
      case 0x4f: return "On, Red-eye reduction, return detected";
      case 0x50: return "Off, Red-eye reduction";
      case 0x58: return "Auto, Did not fire, Red-eye reduction";
      case 0x59: return "Auto, Fired, Red-eye reduction";
      case 0x5d: return "Auto, Fired, Red-eye reduction, return not detected";
      case 0x5f: return "Auto, Fired, Red-eye reduction, return detected";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  components: [ "-","Y","Cb","Cr","B","G","R" ], 
  componentsConfiguration: function(val){
    var id;
    var out;
    for (let i = 0; i < 4; i++){
      out += this.components[(val >> i) & 0x7];
    }
    return out;
  },

  meteringMode: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Average";
      case 2: return "Center-weighted average";
      case 3: return "Spot";
      case 4: return "Multi-spot";
      case 5: return "Multi-segment";
      case 6: return "Partial";
      case 255: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  colorSpace: function(val){
    switch (val) {
      case 0x0001: return "sRGB";
      case 0x0002: return "Adobe RGB";
      case 0xfffd: return "Wide Gamut RGB";
      case 0xfffe: return "ICC Profile";
      case 0xffff: return "Uncalibrated";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sensingMethod: function(val){
    switch (val) {
      case 1: return "Not defined";
      case 2: return "One-chip color area";
      case 3: return "Two-chip color area";
      case 4: return "Three-chip color area";
      case 5: return "Color sequential area";
      case 7: return "Trilinear";
      case 8: return "Color sequential linear";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  customRendered: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Custom";
      case 2: return "HDR (no original saved)";
      case 3: return "HDR (original saved)";
      case 4: return "Original (for HDR)";
      case 5: return "cm";
      case 6: return "Panorama";
      case 7: return "Portrait HDR";
      case 8: return "Portrait";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  compositeImage: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Not a Composite Image";
      case 2: return "General Composite Image";
      case 3: return "Composite Image Captured While Shooting";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  subjectDistanceRange: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Macro";
      case 2: return "Close";
      case 3: return "Distant";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  exposureMode: function(val){
    switch (val) {
      case 0:  return "Auto";
      case 1:  return "Manual";
      case 2:  return "Auto bracket";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  whiteBalance: function(val){
    switch (val) {
      case 0: return "Auto";
      case 1: return "Manual";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sceneCaptureType: function(val){
    switch (val) {
      case 0: return "Standard";
      case 1: return "Landscape";
      case 2: return "Portrait";
      case 3: return "Night";
      case 4: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  gainControl: function(val){
    switch (val) {
      case 0: return "None";
      case 1: return "Low gain up";
      case 2: return "High gain up";
      case 3: return "Low gain down";
      case 4: return "High gain down";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  contrast: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Low";
      case 2: return "High";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  saturation: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Low";
      case 2: return "High";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sharpness: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Soft";
      case 2: return "Hard";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  flash: function(val){
    switch(val){
      case 0x0: return "No Flash";
      case 0x1: return "Fired";
      case 0x5: return "Fired, return not detected";
      case 0x7: return "Fired, return detected";
      case 0x8: return "On, Did not fire";
      case 0x9: return "On, Fired";
      case 0xd: return "On, return not detected";
      case 0xf: return "On, return  detected";
      case 0x10: return "Off, Did not fire";
      case 0x14: return "Off, Did not fire, return not detected";
      case 0x18: return "Auto, Did not fire";
      case 0x19: return "Auto, Fired";
      case 0x1d: return "Auto, Fired, return not detected";
      case 0x1f: return "Auto, Fired, return detected";
      case 0x20: return "No flash function";
      case 0x30: return "Off, No flash function";
      case 0x41: return "Fired, Red-eye reduction";
      case 0x45: return "Fired, Red-eye reduction, return not detected";
      case 0x47: return "Fired, Red-eye reduction, return detected";
      case 0x49: return "On, Red-eye reduction";
      case 0x4d: return "On, Red-eye reduction, return not detected";
      case 0x4f: return "On, Red-eye reduction, return detected";
      case 0x50: return "Off, Red-eye reduction";
      case 0x58: return "Auto, Did not fire, Red-eye reduction";
      case 0x59: return "Auto, Fired, Red-eye reduction";
      case 0x5d: return "Auto, Fired, Red-eye reduction, return not detected";
      case 0x5f: return "Auto, Fired, Red-eye reduction, return detected";
    }
    return f_jpeg.fmtUnknownVal(val);
  },
  components: [ "-","Y","Cb","Cr","B","G","R" ], 
  componentsConfiguration: function(val){
    var id;
    var out;
    for (let i = 0; i < 4; i++){
      out += this.components[(val >> i) & 0x7];
    }
    return out;
  },

  meteringMode: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Average";
      case 2: return "Center-weighted average";
      case 3: return "Spot";
      case 4: return "Multi-spot";
      case 5: return "Multi-segment";
      case 6: return "Partial";
      case 255: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  colorSpace: function(val){
    switch (val) {
      case 0x0001: return "sRGB";
      case 0x0002: return "Adobe RGB";
      case 0xfffd: return "Wide Gamut RGB";
      case 0xfffe: return "ICC Profile";
      case 0xffff: return "Uncalibrated";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sensingMethod: function(val){
    switch (val) {
      case 1: return "Not defined";
      case 2: return "One-chip color area";
      case 3: return "Two-chip color area";
      case 4: return "Three-chip color area";
      case 5: return "Color sequential area";
      case 7: return "Trilinear";
      case 8: return "Color sequential linear";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  customRendered: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Custom";
      case 2: return "HDR (no original saved)";
      case 3: return "HDR (original saved)";
      case 4: return "Original (for HDR)";
      case 5: return "cm";
      case 6: return "Panorama";
      case 7: return "Portrait HDR";
      case 8: return "Portrait";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  compositeImage: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Not a Composite Image";
      case 2: return "General Composite Image";
      case 3: return "Composite Image Captured While Shooting";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  subjectDistanceRange: function(val){
    switch (val) {
      case 0: return "Unknown";
      case 1: return "Macro";
      case 2: return "Close";
      case 3: return "Distant";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  exposureMode: function(val){
    switch (val) {
      case 0:  return "Auto";
      case 1:  return "Manual";
      case 2:  return "Auto bracket";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  whiteBalance: function(val){
    switch (val) {
      case 0: return "Auto";
      case 1: return "Manual";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sceneCaptureType: function(val){
    switch (val) {
      case 0: return "Standard";
      case 1: return "Landscape";
      case 2: return "Portrait";
      case 3: return "Night";
      case 4: return "Other";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  gainControl: function(val){
    switch (val) {
      case 0: return "None";
      case 1: return "Low gain up";
      case 2: return "High gain up";
      case 3: return "Low gain down";
      case 4: return "High gain down";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  contrast: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Low";
      case 2: return "High";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  saturation: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Low";
      case 2: return "High";
    }
    return f_jpeg.fmtUnknownVal(val);
  },

  sharpness: function(val){
    switch (val) {
      case 0: return "Normal";
      case 1: return "Soft";
      case 2: return "Hard";
    }
    return f_jpeg.fmtUnknownVal(val);
  }
}

const js_jpeg = {
  wref: 'https://exiftool.org/TagNames/EXIF.html',
  metadata: {},
  load: function(r){

    var m = f_jpeg.JpegMarker(r);
    if (m === undefined || m.tag != 'SOI') {
      this.metadata.SOI = "invalid jpeg " + (m === null ? "" : m.id);
      return;
    }
    this.metadata[m.tag] = m;
    while ((m = f_jpeg.JpegMarker(r)) && m.offset < r.source.byteLength){
      m.id = r.strHex(m.id);
      this.metadata[m.tag] = m;
      //console.log("add " + m.tag + ": " + JSON.stringify(m));
      r.offset = m.offset + m.size + 2;
    }
  }
}