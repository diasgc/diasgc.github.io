const dbg = true;
//const wref = 'https://learn.microsoft.com/en-us/typography/opentype/spec/';

const jsFontCommon = {
  wref: 'https://learn.microsoft.com/en-us/typography/opentype/spec/',
  SbitLineMetrics: function(r){
    let o = {};
    r.addInt8(o, "ascender", "descender");
    r.addUInt8(o, "widthMax");
    r.addInt8(o, "caretSlopeNumerator", "caretSlopeDenominator", 
      "caretOffset", "minOriginSB", "minAdvanceSB", "maxBeforeBL", 
      "minAfterBL", "pad1", "pad2"
    );
    return o;
  }
}
const js_font = {
  wref: 'https://learn.microsoft.com/en-us/typography/opentype/spec/',
  header: {},
  getData: function(){
    return this.header;
  },
  getString: function(){
    return JSON.stringify(this.header, (key, value) =>
      typeof value === 'bigint'
          ? value.toString()
          : value // return everything else unchanged
    )
  },
  getNames: function(){
    let o = {};
    let records = this.header.tables.name.nameRecords;
    records.forEach((rec) => {
      o[rec.nameID.dsc] = rec.name;
    });
    return o;
  },
  load: function(r){
    r.le = false;
    r.addUInt32(this.header, "sfntVersion");
    r.addUInt16(this.header, "numTables","searchRange","entrySelector","rangeShift");
    this.header.tables = {};
    for (let i = 0; i < this.header.numTables; i++){
      let t = this.getTable(r);
      //if ( t.header === 'undefined' )
      //  continue;
      this.header.tables[t.header.tag.replace('/','')] = t;
    }
  },
  getTable: function(r){
    let table = {tag: r.readString(4)};
    console.log("table " + table.tag);
    r.addUInt32(table, "checksum","offset","length");
    let dtable = { header: table };
    switch (table.tag){
      case "avar": return this.avar.load(r, table); // done
      case "BASE": return this.BASE.load(r, table); // todo
      case "CBDT": return this.CBDT.load(r, table); // todo
      case "CBLC": return this.CBLC.load(r, table); // todo
      case "CFF ":  return this.CFF.load(r, table);  // todo
      case "CFF2": return this.CFF2.load(r, table); // todo
      case "cmap": return this.cmap.load(r, table); // todo
      case "COLR": return this.COLR.load(r, table); // todo
      case "CPAL": return this.CPAL.load(r, table); // todo
      case "cvar": return this.cvar.load(r, table); // todo
      case "cvt ": return this.cvt.load(r, table);  // todo
      case "DSIG": return this.DSIG.load(r, table); // done
      case "EBDT": return this.EBDT.load(r, table); // done
      case "EBLC": return this.EBLC.load(r, table); // done
      case "EBSC": return this.EBSC.load(r, table); // done
      case "fpgm": return this.fpgm.load(r, table); // done
      case "fvar": return this.fvar.load(r, table); // done
      case "gasp": return this.GASP.load(r, table); // do
      case "GDEF": return this.GDEF.load(r, table); // do
      case "glyf": return this.glyf.load(r, table); // do
      case "GPOS": return this.GPOS.load(r, table); // do
      case "GSUB": return this.GSUB.load(r, table); // do
      case "gvar": return this.gvar.load(r, table); // do
      case "hdmx": return this.hdmx.load(r, table); // do
      case "head": return this.head.load(r,table);
      case "hhea": return this.hhea.load(r,table);
      case "hmtx": return this.hmtx.load(r,table);
      case "HVAR": return dtable;  
      case "JSTF": return dtable;
      case "kern": return this.kern.load(r,table);
      case "loca": return this.loca.load(r,table);
      case "LTSH": return dtable;
      case "MATH": return dtable; // do
      case "maxp": return this.maxp.load(r,table);
      case "MERG": return dtable;
      case "meta": return dtable;
      case "MVAR": return dtable;
      case "name": return this.name.load(r,table);
      case "OS/2": return this.OS2.load(r,table);
      case "PCLT": return dtable;
      case "post": return this.post.load(r,table);
      case "prep": return dtable; // do
      case "sbix": return dtable;
      case "STAT": return dtable;
      case "SVG ":  return dtable;
      case "VDMX": return dtable;
      case "vhea": return dtable;
      case "vmtx": return dtable;
      case "VORG": return dtable;
      case "VVAR": return dtable;
      default:     return dtable;
    }
  },
  avar: {
    data: {
      header: {},
      desc: 'Axis Variations Table',
      web: jsFontCommon.wref + "avar",
      segmentMaps: []
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion","reserved");
      this.data.axisCount = r.readUInt16();
      for (let i = 0 ; i < o.axisCount ; i++)
        this.data.segmentMaps.push(this.SegmentMap(r));
      r.popOffset();
      return this.data;
    },
    SegmentMap: function(r){
      let sm = {};
      sm.positionMapCount = r.readUInt16();
      sm.axisValueMapRecord = [];
      for (let i = 0; i < sm.positionMapCount; i++)
        sm.axisValueMapRecord.push(this.AxisValueMapRecord(r));
      return sm;
    },
    AxisValueMapRecord: function(r){
      return {
        fromCoordinate: r.readF2DOT14(),
        toCoordinate: r.readF2DOT14()
      }
    }
  }, // done
  BASE: {
    data: {
      header: {},
      desc: 'Baseline Table',
      web: jsFontCommon.wref + "BASE"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion","minorVersion","horizAxisOffset","vertAxisOffset");
      if (this.data.minorVersion > 0)
        this.data.itemVarStoreOffset = r.readUInt32();
      if (this.data.horizAxisOffset > 0){
        this.data.horizAxisTable = this.AxisTable(r, table.offset + this.data.horizAxisOffset);
      }
      if (this.data.vertAxisOffset > 0)
        this.data.vertAxisTable = this.AxisTable(r, table.offset + this.data.vertAxisOffset);
      r.popOffset();
      return this.data;
    },
    AxisTable: function (r, offset){
      r.pushOffset(offset);
      let o = {};
      r.addUInt16(o, "baseTagListOffset", "baseScriptListOffset");
      if (o.baseTagListOffset > 0){
        r.pushOffset(offset + o.baseTagListOffset);
        o.baselineTags = [];
        o.baseTagCount = r.readUInt16();
        for (let i = 0 ; i < o.baseTagCount; i++)
          o.baselineTags.push(r.readString(4));
        r.popOffset();
      }
      if (o.baseScriptListOffset > 0){
        r.pushOffset(offset + o.baseScriptListOffset);
        o.baseScriptRecords = [];
        o.baseScriptCount = r.readUInt16();
        for (let i = 0 ; i < o.baseScriptCount; i++){}
          o.baseScriptRecords.push(this.BaseScriptTable(r, offset + o.baseScriptListOffset));
        r.popOffset();
      }
      r.popOffset();
      return o;
    },
    BaseScriptTable: function(r, baseScriptListOffset){
      let o = {
        baseScriptTag:    r.readString(4),
        baseScriptOffset: r.readUInt16(),
      };
      r.pushOffset(baseScriptListOffset + o.baseScriptOffset);
      r.addUInt16(o, "baseValuesOffset", "defaultMinMaxOffset", "baseLangSysCount");
      if (o.baseLangSysCount > 0){
        o.baseLangSysRecords = [];
        for (let i = 0 ; i < o.baseLangSysCount; i++){
          let tag = this.BaseLangSys(r)
          o.baseLangSysRecords.push(tag);
        }
      }
      r.popOffset();     
      return o;
    },
    BaseLangSys: function(r){
      return  {
        baseLangSysTag: r.readString(4),
        minMaxOffset: r.readUInt16()
      };
    }

  }, // done
  CBDT: {
    data: {
      header: {},
      desc: 'Color Bitmap Data Table',
      web: jsFontCommon.wref + "CBDT"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(o, "majorVersion","minorVersion");
      r.popOffset();
      return o;
    }
  }, // done
  CBLC: {
    data: {
      header: {},
      desc: 'Color Bitmap Location Table',
      web: jsFontCommon.wref + "CBLC"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion","minorVersion");
      r.addUInt32(this.data, "numSizes");
      this.data.bitmapSizes = [];
      for (let i = 0 ; i < this.numSizes; i++)
        this.data.bitmapSizes = this.BitmapSize(r);
      r.popOffset();
      return o;
    },
    BitmapSize: function(r){
      let bitmapSize = {};
      r.addUInt32(bitmapSize, "indexSubtableListOffset", "indexSubtableListOffset", "indexSubtableListSize", "numberOfIndexSubtables", "colorRef")
      bitmapSize.hori = this.SbitLineMetrics(r);
      bitmapSize.vert = this.SbitLineMetrics(r);
      r.addUInt16(bitmapSize, "startGlyphIndex", "endGlyphIndex");
      r.addUInt8(bitmapSize, "ppemX", "ppemY", "bitDepth");
      bitmapSize.flags = r.readInt8();
      return bitmapSize;
    },
    SbitLineMetrics: function(r){
      let o = {};
      r.addInt8(o, "ascender","descender");
      r.addUInt8(o, "widthMax");
      r.addInt8(o, "caretSlopeNumerator","caretSlopeDenominator","caretOffset","minOriginSB","minAdvanceSB","maxBeforeBL","minAfterBL", "pad1", "pad2");
      return o;
    }
  }, // done
  CFF: {
    data: {
      header: {},
      desc: 'Compact Font Format (Version 1)',
      web: jsFontCommon.wref + "CFF"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      // todo
      r.popOffset();
      return this.data;
    }
  }, // todo
  CFF2: {
    data: {
      header: {},
      desc: 'Compact Font Format (Version 2)',
      web: jsFontCommon.wref + "CFF2"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt8(this.data, "majorVersion", "minorVersion", "headerSize");
      this.data.topDICTSize = r.readUInt16(); 
      r.popOffset();
      return this.data;
    }
  }, // done
  COLR: {
    data: {
      header: [],
      desc: 'Color Table',
      web: jsFontCommon.wref + "COLR",
      baseGlyphRecords: [],
      layerRecords: []
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "version","numBaseGlyphRecords");
      r.addUInt32(this.data,"baseGlyphRecordsOffset","layerRecordsOffset");
      r.addUInt16(this.data, "numLayerRecords");
      this.data.baseGlyphRecords = this.BaseGlyphRecords(r, this.baseGlyphRecordsOffset, this.numBaseGlyphRecords);
      this.data.layerRecords = this.LayerRecords(r, this.data.layerRecordsOffset, this.data.numLayerRecords);
      if (this.data.version > 0){
        r.addUInt32(this, "baseGlyphListOffset","layerListOffset","clipListOffset","varIndexMapOffset","itemVariationStoreOffset");
        if (this.data.baseGlyphListOffset > 0)
          this.data.baseGlyphList = this.BaseGlyphList(r, this.data.baseGlyphListOffset);
        if (this.data.layerListOffset > 0)
          this.data.layerList = this.LayerList(r, this.data.layerListOffset);
        if (this.data.clipListOffset > 0)
          this.data.clipList = this.ClipList(r, this.data.clipListOffset);
      }
      r.popOffset();
      return this.data;    
    },
    BaseGlyphRecords: function(r, offset, num){
      let o = [];
      r.pushOffset(offset);
      for (let i = 0 ; i < num; i++){
        let g = {};
        r.addUInt16(g, "glyphID", "firstLayerIndex", "numLayers");
        o.push(g);
      }
      r.popOffset();
      return o;
    },
    LayerRecord: function(r, offset, num){
      let o = [];
      r.pushOffset(offset);
      for (let i = 0 ; i < num; i++){
        let g = {};
        r.addUInt16(g, "glyphID", "paletteIndex");
        o.push(g);
      }
      r.popOffset();
      return o;
    },
    BaseGlyphList: function(r, offset){
      r.pushOffset(offset);
      let o = {
        numBaseGlyphPaintRecords: r.readUInt32(),
        baseGlyphPaintRecords: []
      };
      for (let i = 0 ; i < o.numBaseGlyphPaintRecords; i++){
        baseGlyphPaintRecords.push({
          glyphID: r.readUInt16(),
          paintOffset: r.readUInt32()
        });
      }
      r.popOffset()
      return o;
    },
    LayerList: function(r, offset){
      r.pushOffset(offset);
      let n = r.readUInt32();
      let o = {
        numLayers: n,
        paintOffsets: r.readUInt32Array(n)
      };
      r.popOffset()
      return o;
    },
    ClipList: function(r, offset){
      r.pushOffset(offset);
      let o = {
        format: r.readUInt8(),
        numClips: r.readUInt32(),
        clips: []
      };
      for (let i = 0 ; i < o.numClips; i++){
        o.clips.push({
          startGlyphID: r.readUInt16(),
          endGlyphID: r.readUInt16(),
          clipBoxOffset: r.readUInt24()
        });
      }
      r.popOffset()
      return o;
    },
  }, // done
  CPAL: {
    data: {
      header: {},
      desc: 'Color Palette Table',
      web: jsFontCommon.wref + "CPAL"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      // todo
      r.popOffset();
      return this.data;
    }
  }, // todo
  cvar: {
    data: {
      header: {},
      desc: 'CVT Variations Table',
      web: jsFontCommon.wref + "cvar"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      // todo
      r.popOffset();
      return this.data;
    }

  }, // todo
  cvt: {
    data: {
      header: {},
      desc: 'Control Value Table',
      web: jsFontCommon.wref + "cvt"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.popOffset();
      return this.data;
    }
  }, // todo
  cmap: {
    data: {
      header: {},
      desc: 'Character to Glyph Index Mapping Table',
      web: jsFontCommon.wref + "cmap",
      encodingRecords: []
    },
    load: function(r, table){
      r.pushOffset(table.offset);
      this.data.header = table
      r.addUInt16(this.data, "version","numTables");
      for (let i = 0; i < this.data.numTables; i++)
        this.data.encodingRecords.push(this.EncodingRecord(r, table.offset));
      r.popOffset();
      return this.data;
    },
    getGlifMap: function(){
      let out = {};
      this.data.encodingRecords.forEach((rec) => out[rec.platformID.d] = rec.encodingTable.getCharMap());
      return out;
    },
    EncodingRecord: function(r, tableOffset){
      let out = {};
      out.platformID = PLATFORM_ID.readUInt16(r);
      out.encodingID = r.readUInt16();
      out.offset = r.readInt32();
      out.encodingTable = this.EncodingTable(r, tableOffset + out.offset);
      return out;
    },
    EncodingTable: function(r, offset){
      r.pushOffset(offset);
      let o = {};
      r.addUInt16(o, "format", "length", "language");
      switch (this.format) {
        case 0:
          o.glyphIndexArray = r.readUInt8Array(256);
          break;
        case 2:
          o.subHeaderKeys = r.readUInt16Array(256);
        case 4:
          o.segCountX2 = r.readUInt16();     //2 × segCount
          const segCount = this.segCountX2 / 2;
          o.searchRange = r.readUInt16();    //2 × (2**floor(log2(segCount)))
          o.entrySelector = r.readUInt16();  //log2(searchRange/2)
          o.rangeShift = r.readUInt16();     //2 × segCount - searchRange
          o.endCode = r.readUInt16Array(segCount);        // [segCount] End characterCode for each segment, last=0xFFFF.
          o.reservedPad = r.readUInt16();                 // Set to 0.
          o.startCode = r.readUInt16Array(segCount);      // [segCount] Start character code for each segment.
          o.idDelta = r.readUInt16Array(segCount);        // [segCount] Delta for all character codes in segment.
          o.idRangeOffset = r.readUInt16Array(segCount);  // [segCount] Offsets into glyphIdArray or 0
          const len = ((offset + o.length) - r.offset)/2;   
          o.glyphIdArray = r.readUInt16Array(len);        // Glyph index array (arbitrary length)
      }
      r.popOffset();
      return o;
    },
    getCharRangesMap: function(encodingTable){
      let o ={}
      if (encodingTable.format == 4){
        let segCount = encodingTable.segCountX2 / 2;
        for (let i = 0 ; i < segCount ; i++){
          let ch = {};
          for (let j = encodingTable.startCode[i]; j <= encodingTable.endCode[i]; j++ )
            ch["0x" + j.toString(16).padStart(4,'0')] = String.fromCharCode(j);
          o["u+" + encodingTable.startCode[i].toString(16).padStart(4,'0'), "u+" + encodingTable.endCode[i].toString(16).padStart(4,'0')] = ch;
        }
      }
      return o;
    },
    getCharMap: function(encodingTable){
      let o ={}
      if (encodingTable.format == 4){
        let segCount = encodingTable.segCountX2 / 2;
        for (let i = 0 ; i < segCount ; i++){
          let list = [];
          for (let j = encodingTable.startCode[i]; j <= encodingTable.endCode[i]; j++ )
            list.push(j);
          list.sort();
          list.forEach((j) => o["u+" + j.toString(16).padStart(4,'0')] = String.fromCharCode(j));
        }
      }
      return o;
    }
  }, // done
  DSIG: {
    data: {
      header: {},
      desc: 'Digital Signature Table',
      web: jsFontCommon.wref + "DSIG",
    },    
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt32(this.data, "version");
      r.addUInt16(this.data, "numSignatures", "flags");
      if (this.data.numSignatures > 0){
        this.data.signatureRecords = [];
        for (let i = 0 ; i < this.data.numSignatures; i++){
          let o = {};
          r.addUInt32(o, "format", "length", "signatureBlockOffset");
          if (o.format == 1){
            r.addUInt16(o, "reserved1", "reserved2");
            r.addUInt32(o, "signatureLength");
            o.signature = r.readUInt8Array(o.signatureLength);
          }
          this.data.signatureRecords.push(o);
        }
      }
      r.popOffset();
      return this.data;
    }
  }, // done
  EBDT: {
    data: {
      header: {},
      desc: 'Embedded Bitmap Data Table',
      web: jsFontCommon.wref + 'EBDT',
    },    
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion");
      r.popOffset();
    }
  },
  EBLC: {
    data: {
      header: {},
      bitmapSizes: [],
      desc: 'Embedded Bitmap Location Table',
      web: jsFontCommon.wref + 'EBLC',
    },    
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion");
      this.data.numSizes = r.readUInt32();
      for (let i = 0; i < this.data.numSizes; i++){
        let record = {};
        r.addUInt32(record, "indexSubtableListOffset", "indexSubtableListSize","numberOfIndexSubtables", "colorRef");
        record.hori = jsFontCommon.SbitLineMetrics(r);
        record.vert = jsFontCommon.SbitLineMetrics(r);
        r.addUInt16(record, "startGlyphIndex", "endGlyphIndex");
        r.addUInt8(record, "ppemX", "ppemY", "bitDepth");
        r.addInt8(record, "flags");
        bitmapSizes.push(record);
      }
      r.popOffset();
      return this.data;
    }
  }, // done
  EBSC: {
    data: {
      header: {},
      BitmapScales: [],
      desc: 'Embedded Bitmap Scaling Table',
      web: jsFontCommon.wref + 'EBSC',
    },    
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion");
      this.data.numSizes = r.readUInt32();
      for (let i = 0; i < this.data.numSizes; i++){
        let record = {};
        record.hori = jsFontCommon.SbitLineMetrics(r);
        record.vert = jsFontCommon.SbitLineMetrics(r);
        r.addUInt8(record, "ppemX", "ppemY", "substitutePpemX", "substitutePpemY");
        BitmapScales.push(record);
      }
      r.popOffset();
      return this.data;
    }
  }, // todo
  fpgm: {
    data: {
      header: {},
      desc: 'Font Program',
      web: jsFontCommon.wref + 'fpgm',
    },    
    load: function(r, table){
      this.data.header = table;
      return this.data;
    }
  }, // no tables
  fvar: {
    data: {
      header: {},
      VariationAxisRecords: [],
      InstanceRecords: [],
      desc: 'Font Variations Table',
      web: jsFontCommon.wref + 'fvar',
    },    
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion", "axesArrayOffset", "reserved", "axisCount", "axisSize", "instanceCount", "instanceSize");
      r.pushOffset(table.offset + this.data.axesArrayOffset);
      for (let i = 0; i < this.data.axisCount; i++){
        VariationAxisRecords.push({
          axisTag: r.readString(4),
          minValue: r.readFixed(),
          defaultValue: r.readFixed(),
          maxValue: r.readFixed(),
          flags: r.readUInt16(),
          axisNameID: r.readUInt16()
        });
      }
      for (let i = 0; i < this.data.instanceCount; i++){
        let coordinates = [];
        for (let j = 0; i < this.data.axisCount; i++)
          coordinates.push(r.readFixed());
        InstanceRecords.push(coordinates);
      }
      r.popOffset();
      return this.data;
    }
  },
  GASP: {
    data: {
      header: {},
      GaspRanges: [],
      desc: 'Grid-fitting and Scan-conversion Procedure Table',
      web: jsFontCommon.wref + "gasp"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "version", "numRanges");
      for (let i = 0; i < this.data.numRanges; i++){
        this.data.GaspRanges.push({
          rangeMaxPPEM: r.readUInt16(),
          rangeGaspBehavior: r.readUInt16()
        })
      }
      r.popOffset();
      return this.data;
    }
  }, // partialy done (todo subtables)
  GDEF: {
    data: {
      header: {},
      desc: 'Glyph Definition Table',
      web: jsFontCommon.wref + "GDEF"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion", "glyphClassDefOffset", "attachListOffset", "ligCaretListOffset", "markAttachClassDefOffset");
      if (this.data.minorVersion > 1){
        r.addUInt16(this.data, "markGlyphSetsDefOffset");
        if (this.data.minorVersion > 2)
          r.addUInt32(this.data, "itemVarStoreOffset");
      }
      r.popOffset();
      return this.data;
    }
  }, // partialy done (todo subtables)
  glyf: { 
    data: {
      header: {},
      desc: 'Glyph Data',
      web: jsFontCommon.wref + "glyf"
    },
    load: function(r, table){
      this.data.header = table;
      /*
       The total number of glyphs is specified by the numGlyphs field in the 'maxp' table.
       The 'glyf' table does not include any overall table header or records providing offsets to glyph data blocks.
       Rather, the 'loca' table provides an array of offsets,
      */
      return this.data;
    }
  }, // todo - no tables
  GPOS: {
    data: {
      header: {},
      desc: 'Glyph Positioning Table',
      web: jsFontCommon.wref + "GPOS"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion", "scriptListOffset", "featureListOffset", "lookupListOffset");
      if (this.data.minorVersion > 0){
        r.addUInt32(this.data, "featureVariationsOffset");
      }
      r.popOffset();
      return this.data;
    }
  }, // partialy done (todo subtables)
  GSUB: {
    data: {
      header: {},
      desc: 'Glyph Substitution Table',
      web: jsFontCommon.wref + "GSUB"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion", "scriptListOffset", "featureListOffset", "lookupListOffset");
      if (this.data.minorVersion > 0){
        r.addUInt32(this.data, "featureVariationsOffset");
      }
      r.popOffset();
      return this.data;
    }
  }, // partialy done (todo subtables)
  gvar: {
    data: {
      header: {},
      desc: 'Glyph Variations Table',
      web: jsFontCommon.wref + "gvar"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion", "axisCount", "sharedTupleCount");
      r.addUInt32(this.data, "sharedTuplesOffset");
      r.addUInt16(this.data, "glyphCount", "flags");
      r.addUInt32(this.data, "glyphVariationDataArrayOffset");
      this.data.glyphVariationDataOffsets = [];
      for (let i = 0 ; i <= glyphCount; i++){
        this.data.glyphVariationDataOffsets.push(r.readUInt32());
      }
      r.popOffset();
      return this.data;
    }
  },  // partialy done (todo subtables)
  hdmx: {
    data: {
      header: {},
      desc: 'Horizontal Device Metrics',
      web: jsFontCommon.wref + "hdmx"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "version", "numRecords");
      r.addUInt32(this.data, "sizeDeviceRecord");
      this.data.deviceRecordOffset = r.offset;
      r.popOffset();
      return this.data;
    },
    // we need maxp table first to get numGlyphs, so we can load DeviceRecords
    loadDeviceRecords: function(table, r, numGlyphs){
      r.pushOffset(this.data.deviceRecordOffset);
      table.DeviceRecords = [];
      for (let i = 0 ; i <= this.data.numRecords; i++){
        table.DeviceRecords.push({
          pixelSize: r.readUInt8(),
          maxWidth: r.readUInt8(),
          widths: r.readUInt8Array(numGlyphs)
        })
      }
    }
  },  // partialy done (todo subtables)
  head: {
    data: {
      header: {},
      desc: 'Font Header Table',
      web: jsFontCommon.wref + "head",
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data,"majorVersion","minorVersion");
      this.data.fontRevision = r.readFixed();
      r.addUInt32(this.data, "checksumAdjustment", "magicNumber");
      r.addUInt16(this.data,"flags","unitsPerEm");
      this.data.created = r.readUInt32Array(2);
      this.data.modified = r.readUInt32Array(2);
      r.addInt16(this.data, "xMin", "yMin", "xMax", "yMax");
      r.addUInt16(this.data, "macStyle", "lowestRecPPEM");
      r.addInt16(this.data, "fontDirectionHint", "indexToLocFormat", "glyphDataFormat");
      r.popOffset();
      return this.data;
    }
  }, // done
  hhea: {
    data: {
      header: {},
      desc: 'Horizontal Header Table',
      web: jsFontCommon.wref + "hhea",
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "majorVersion", "minorVersion");
      r.addInt16(this.data, "ascender", "descender", "lineGap");
      r.addUInt16(this.data, "advanceWidthMax");
      r.addInt16(this.data, "minLeftSideBearing", "minRightSideBearing", 
        "xMaxExtent", "caretSlopeRise", "caretSlopeRun", "caretOffset");
      this.data.reserved = r.readUInt32Array(2);
      r.addInt16(this.data, "metricDataFormat");
      r.addUInt16(this.data, "numberOfHMetrics");
      r.popOffset();
      return this.data;
    }
  }, // done
  hmtx: {
    data: {
      header: {},
      desc: "Horizontal Metrics Table",
      web: jsFontCommon.wref + "head",
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      // todo
      r.popOffset();
      return this.data; 
    }
  }, // todo - no tables
  kern: {
    data: {
      header: {},
      KerningSubtables: [],
      desc: 'Kerning',
      web: jsFontCommon.wref + "kern"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "version", "nTables");
      for (let i = 0; i < this.data.nTables; i++){
        let subTableOffset = r.offset;
        let subTable = {};
        r.addUInt16(subTable, "version", "length");
        subTable.coverage = flagsCoverage(r.readUInt16());
        if (subTable.coverage.format == 0){
          r.addUInt16(subTable, "nPairs", "searchRange", "entrySelector", "rangeShift");
          subTable.KernPairs = [];
          for (let i = 0 ; i < subTable.nPairs; i ++){
            subTable.KernPairs.push({
              left: r.readUInt16(),
              right: r.readUInt16(),
              value: r.readFword()
            })
          }
        } else if (subTable.coverage.format == 2){
          let format2Offset = r.offset;
          subTable.rowWidth = r.readUInt16();
          subTable.leftClass = format2ClassTable(r, format2Offset, r.readUInt16());
          subTable.rightClass = format2ClassTable(r, format2Offset, r.readUInt16());
          subTable.kerningArrayClass = format2ClassTable(r, format2Offset, r.readUInt16());
        }
        KerningSubtables.push(subTable);
        r.offset = subTableOffset + subTable.length;
      }
      r.popOffset();
      return this.data;
    },
    flagsCoverage: function(c){
      return {
        horizontal: (c & 1) != 0,
        minimum: (c & 2) != 0,
        crossStream: (c & 4) != 0,
        override: (c & 8) != 0,
        format: ( c >> 8 )
      };
    },
    format2ClassTable: function(r, tableOffset, classOffset){
      r.pushOffset(tableOffset + classOffset);
      let classTable = {
        firstGlyph: r.readUInt16(),
        nGlyphs: r.readUInt16()
      }
      r.popOffset();
      return classTable;
    }
  }, 
  loca: {
    data: {
      header: {},
      desc: 'Index to Location',
      web: jsFontCommon.wref + "loca"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.popOffset();
      return this.data;
    }
  }, // depends on maxp.numGlyphs
  maxp: {
    data: {
      header: {},
      desc: 'Maximum Profile',
      web: jsFontCommon.wref + "maxp"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      this.data.version = r.readFixed();
      this.data.numGlyphs = r.readUInt16();
      if (this.data.version > 0x00010000){
        r.addUInt16(this.data, "maxPoints", "maxContours",
           "maxCompositePoints", "maxCompositeContours", 
           "maxZones", "maxTwilightPoints", "maxStorage", 
           "maxFunctionDefs", "maxInstructionDefs", "maxStackElements", 
           "maxSizeOfInstructions", "maxComponentElements", "maxComponentDepth");
      }
      r.popOffset();
      return this.data;
    }
  }, // done
  name: {
    data: {
      header: {},
      nameRecords: [],
      desc: 'Naming Table',
      web: jsFontCommon.wref + "name"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data, "format", "count", "stringOffset");
      for (let i = 0 ; i < this.data.count ; i++)
        this.data.nameRecords.push(this.NameRecord(r, table.offset + this.data.stringOffset));
      if (this.data.format == 1){
        this.data.langTagCount = r.readUInt16();
        this.data.langTagRecords = [];
        for (let i = 0 ; i < this.data.langTagCount ; i++)
          this.data.langTagRecords.push(this.LangTagRecord(r, table.offset + this.data.stringOffset));
      }
      return this.data;
    },
    getNames: function(){
      let out = {};
      this.data.nameRecords.forEach((r) => out[r.nameID.tag] = r.name);
      return out;
    },
    NameRecord: function(r, stringOffset){
        let record = {};
        record.platformID = PLATFORM_ID.readUInt16(r); // Platform ID.
        record.encodingID = r.readUInt16();            // Platform-specific encoding ID.
        record.encodingID_desc = PLATFORM_ID.encodingId(record.platformID, record.encodingID);
        record.languageID = r.readUInt16();            // Language ID.
        record.nameID = NAME_ID.readInt16(r);          // Name ID.
        record.length = r.readUInt16();                // String length (in bytes).
        record.offset = r.readUInt16();                // String offset from start of storage area (in bytes).
        r.pushOffset(stringOffset + record.offset);
        record.name = r.readString(record.length);
        r.popOffset();
        return record;
    },
    LangTagRecord: function(r, stringTableOffset){
      let langTagRecord = {
        lenght: r.readUInt16(),
        offset: r.readUInt16()
      };
      r.pushOffset(langTagRecord.offset + stringTableOffset);
      langTagRecord.name = r.readString(langTagRecord.lenght);
      r.popOffset();
      return langTagRecord;
    }
  }, // done
  OS2: {
    data: {
      desc: "OS/2 and Windows Metrics Table",
      web: jsFontCommon.wref + "os2"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      r.addUInt16(this.data,
        "version","xAvgCharWidth","usWeightClass","usWidthClass",
        "fsType", "ySubscriptXSize", "ySubscriptYSize", 
        "ySubscriptXOffset", "ySubscriptYOffset", "ySuperscriptXSize", "ySuperscriptYSize",
        "ySuperscriptXOffset", "ySuperscriptYOffset","yStrikeoutSize","yStrikeoutPosition",
        "sFamilyClass"
      );
      this.data.panose = r.readUInt8Array(10);
      r.addUInt32(this.data, "ulUnicodeRange1", "ulUnicodeRange2",
        "ulUnicodeRange3", "ulUnicodeRange4"
      );
      this.data.achVendID = r.readString(4);
      r.addUInt16(this.data, "fsSelection","usFirstCharIndex", "usLastCharIndex", "sTypoAscender", 
        "sTypoDescender", "sTypoLineGap", "usWinAscent", "usWinDescent"
      );
      if (this.data.version > 0){
        r.addUInt32(this.data, "ulCodePageRange1", "ulCodePageRange2");
        if (this.data.version > 1){
          r.addUInt16(this.data, "sxHeight", "sCapHeight", "usDefaultChar", "usBreakChar", "usMaxContext");
          if (this.data.version > 4){
            r.addUInt16(this.data, "usLowerOpticalPointSize", "usUpperOpticalPointSize");
          }
        }
      }
      r.popOffset();
      return this.data;
    }
  }, // done
  post: {
    data: {
      desc: "PostScript Table",
      web: jsFontCommon.wref + "post"
    },
    load: function(r, table){
      this.data.header = table;
      r.pushOffset(table.offset);
      this.data.version = r.readFixed();
      this.data.italicAngle = r.readFixed();
      this.data.underlinePosition = r.readFword();
      this.data.underlineThickness = r.readFword();
      this.data.minMemType42 = r.readUInt32();
      this.data.maxMemType42 = r.readUInt32();
      this.data.minMemType1 = r.readUInt32();
      this.data.maxMemType1 = r.readUInt32();
      r.popOffset();
      return this.data;
    }
  } // done
}

const PLATFORM_ID = {
  readUInt16: function(r){
    let platform_id = {};
    let arr = [ "Unicode", "Macintosh", "ISO", "Windows", "Custom" ];
    platform_id.id = r.readUInt16();
    platform_id.desc = arr[ Math.max(0, Math.min(arr.length, this.i)) ];
    return platform_id;
  },
  encodingId: function(platform_id, encodingId){
    if (platform_id.id != 3)
      return "unknown"
    let arr = [ "Symbol","Unicode BMP","ShiftJIS","PRC","Big5","Wansung","Johab","Reserved","Reserved","Reserved","Unicode full repertoire" ];
    return arr[ Math.max(0, Math.min(arr.length, encodingId)) ];
  }
};

const NAME_ID = {
  readInt16: function(r){
    let o = {
      index: r.readInt16(),
      tag: "NID_UNKNOWN",
      dsc: "Unkndown",
    };
    const v = [
      { id: "NID_COPYRIGH", dsc: "Copyright notice"},
      { id: "NID_FAMILY", dsc: "Font Family name"},
      { id: "NID_SUBFAMILY", dsc: "Font Subfamily name"},
      { id: "NID_UNFONTID", dsc: "Unique font identifier"},
      { id: "NID_FULLNAME", dsc: "Full font name"},
      { id: "NID_VERSION", dsc: "Version string"},
      { id: "NID_PSTSNAME", dsc: "PostScript name"},
      { id: "NID_TRADEMRK", dsc: "Trademark"},
      { id: "NID_MANUFACT", dsc: "Manufacturer Name"},
      { id: "NID_DESIGNER", dsc: "Designer Name"},
      { id: "NID_DESCRIPTION", dsc: "Description"},
      { id: "NID_URLVENDOR", dsc: "URL Vendor"},
      { id: "NID_URLDESIGNER", dsc: "URL Designer"},
      { id: "NID_LICENSEDESC", dsc: "License Description"},
      { id: "NID_LICENSEINFO", dsc: "License Info URL"},
      { id: "NID_RESERVED", dsc: "Reserved"},
      { id: "NID_TYPOFAMILY", dsc: "Typographic Family name"},
      { id: "NID_TYPOSUBFAM", dsc: "Typographic Subfamily name"},
      { id: "NID_MACCOMPAT", dsc: "Compatible Full (Macintosh only)"},
      { id: "NID_SAMPLETEXT", dsc: "Sample text"},
      { id: "NID_POSTSCID", dsc: "PostScript CID findfont name"},
      { id: "NID_WWSFAMILY", dsc: "WWS Family Name"},
      { id: "NID_WWSSUBFAM", dsc: "WWS Subfamily Name"},
      { id: "NID_LGTBKGPAL", dsc: "Light Background Palette"},
      { id: "NID_DRKBKGPAL", dsc: "Dark Background Palette"},
      { id: "NID_PSVARPRFX", dsc: "Variations PostScript Name Prefix"}
    ];
    if (o.index >= 0 && o.index < v.length){
      let nameid = v[o.index];
      o.tag = nameid.id;
      o.dsc = nameid.dsc;
    }
    return o;
  }
};