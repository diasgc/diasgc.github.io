Number.prototype.strHex = function(pad){
  return "0x" + this.toString(16).padStart(pad,'0');
}

const config = {
  splitItemTitle: true,
  showHex: true,
  refs: [
    'https://www.media.mit.edu/pia/Research/deepview/exif.html',
    'https://web.archive.org/web/20190624045241if_/http://www.cipa.jp:80/std/documents/e/DC-008-Translation-2019-E.pdf',
    'https://web.mit.edu/graphics/src/Image-ExifTool-6.99/html/TagNames/EXIF.html'
  ],
  jstest: 'https://playcode.io/empty_javascript' 
}

class MetadataImage {

  // see https://www.file-recovery.com/mp4-signature-format.htm
  // https://github.com/alfg/quick-dive-into-mp4
  constructor(dataReader){
    this.datareader = dataReader;
    this.metadata = {};
    dataReader.pushOffset(0);
    this.load(dataReader);
    dataReader.popOffset()
  }

  load(r){
    let meta;
    // SOI Start of Image - Jpeg
    if (r.source.getUint16(0, false) == 0xffd8){ 
      meta = new MetadataJPEG(this.datareader);
    // ftyp - ISO BMFF
    } else if (r.source.getUint32(4, false) == 0x66747970){ 
      r.le = false;
      meta = new MetadataISOBMFF(r);
    // PNG
    } else if(MetadataPNG.checkSignature(r)){
      meta = new MetadataPNG(r);
    }
    if (meta)
      this.metadata = meta.metadata;
  }
}

class MetadataEXIF {

  // refs:
  // https://www.media.mit.edu/pia/Research/deepview/exif.html
  // https://web.archive.org/web/20190624045241if_/http://www.cipa.jp:80/std/documents/e/DC-008-Translation-2019-E.pdf
  // https://web.mit.edu/graphics/src/Image-ExifTool-6.99/html/TagNames/EXIF.html

  constructor(dataReader, offset=0){
    this.datareader = dataReader;
    this.metadata = {};
    dataReader.pushOffset(offset);
    this.Exif(dataReader, this.metadata);
    dataReader.popOffset();
  }

  TIFF(r, m){
    let byteOrder = r.readInt16();
    r.le = byteOrder == 0x4949;
    let header = {
      endianness: byteOrder,
      signature: r.readUInt16(),
      ifd0_offset: r.readUInt32()
    };
    m.TIFF = header;
    return header.signature === 0x002a;
  }

  Exif(r, m){
    let nativeLE = r.le;
    let exifOffset = r.offset;
    if(!this.TIFF(r, m)){
      m.TIFF.signature += " (invalid signature " + r.strHex(m.TIFF.signature)+")";
      r.le = nativeLE;
      return m;
    }
    this.IFD.add(this, r, this.IFD_IFD0, m, "IFD0", exifOffset, m.TIFF.ifd0_offset);
    r.le = nativeLE;
  }

  coords(v){
    return v[0] + "°" + v[1] + "'" + v[2] + "\"";
  }

  timeStamp(v){
    return v[0] + "h " + v[1] + "m " + v[2] + "s";
  }

  IFD_GPS = {
    keys: {
      "0x0000": { name: "GPSVersionID", print: function(v){
        return v.join('.');
      } }, //int8u[4]:
      "0x0001": { name: "GPSLatitudeRef", print: function(v){
        return v.replace(/\0/g, '');
      }}, //string[2]
      "0x0002": { name: "GPSLatitude", print: this.coords}, //rational64u[3]
      "0x0003": { name: "GPSLongitudeRef", print: function(v){
        return v.replace(/\0/g, '');
      }}, //string[2]
      "0x0004": { name: "GPSLongitude", print: this.coords},
      "0x0005": { name: "GPSAltitudeRef", print: {
        "0": "Sea level",
        "1": "Sea level reference (negative value)"
      }}, //int8u
      "0x0006": { name: "GPSAltitude", print: function(v){
        return v + " meters";
      }}, //rational64u
      "0x0007": { name: "GPSTimeStamp", print: this.timeStamp}, //rational64u[3]
      "0x0008": { name: "GPSSatellites" }, //string
      "0x0009": { name: "GPSStatus", print: {
        "A": "Measurement in progress",
        "V": "Measurement interrupted"
      }}, //string[2]
      "0x000a": { name: "GPSMeasureMode", print: {
        "2": "2-dimensional measurement",
        "3": "3-dimensional measurement"
      }}, //string[2]
      "0x000b": { name: "GPSDOP" }, //rational64u
      "0x000c": { name: "GPSSpeedRef", print: {
        "K": "km/h Kilometers per hour",
        "M": "mph Miles per hour",
        "N": "knots"
      }}, //string[2]
      "0x000d": { name: "GPSSpeed" }, //rational64u
      "0x000e": { name: "GPSTrackRef", print: {
        "T": "True direction",
        "M": "Magnetic direction"
      }},
      "0x000f": { name: "GPSTrack" }, //rational64u
      "0x0010": { name: "GPSImgDirectionRef", print: {
        "T": "True direction",
        "M": "Magnetic direction"
      }},
      "0x0011": { name: "GPSImgDirection" }, //rational64u
      "0x0012": { name: "GPSMapDatum" }, //string
      "0x0013": { name: "GPSDestLatitudeRef", print: {
        "T": "True direction",
        "M": "Magnetic direction"
      }},
      "0x0014": { name: "GPSDestLatitude", print: this.coords}, //rational64u[3]
      "0x0015": { name: "GPSDestLongitudeRef", print: {
         "T": "True direction",
         "M": "Magnetic direction"
       }},
      "0x0016": { name: "GPSDestLongitude", print: this.coords}, //rational64u[3]
      "0x0017": { name: "GPSDestBearingRef", print: {
        "T": "True direction",
        "M": "Magnetic direction"
      }},
      "0x0018": { name: "GPSDestBearing" }, //rational64rational2coordsu
      "0x0019": { name: "GPSDistDistanceRef", print: {
        "T": "True direction",
        "M": "Magnetic direction"
      }},
      "0x001a": { name: "GPSDestDistance" }, //rational64u
      "0x001b": { name: "GPSProcessingMethod" }, //undef
      "0x001c": { name: "GPSAreaInformation" }, //undef
      "0x001d": { name: "GPSDateStamp" }, //string[11]
      "0x001e": { name: "GPSDifferential" }, //int16u
      "0x001f": { name: "GPSHPositioningError" }, //rational64u
    }
  }

  IFD_IFD0 = {
    keys: {
      "0x000b": { name: "ProcessingSoftware" },
      "0x00fe": { name: "SubfileType", fmt: "h", print: {
        "0x0000": "Full-resolution image",
        "0x0001": "Reduced-resolution image",
        "0x0002": "Single page of multi-page image",
        "0x0003": "Single page of multi-page reduced-resolution image",
        "0x0004": "Transparency mask",
        "0x0005": "Transparency mask of reduced-resolution image",
        "0x0006": "Transparency mask of multi-page image",
        "0x0007": "Transparency mask of reduced-resolution multi-page image",
        "0x0008": "Depth map",
        "0x0009": "Depth map of reduced-resolution image",
        "0x0010": "Enhanced image data",
        "0x1001": "Alternate reduced-resolution image"
      }},
      "0x00ff": { name: "OldSubfileType", print: {
        "1": "Full-resolution image",
        "2": "Reduced-resolution image",
        "3": "Single page of multi-page image"
      } },
      "0x0100": { name: "ImageWidth" },
      "0x0101": { name: "ImageHeight" },
      "0x0102": { name: "BitsPerSample" },
      "0x0103": { name: "Compression", fmt: "h", print: {
        "0x0001": "Uncompressed",
        "0x0002": "CCITT 1D",
        "0x0003": "T4/Group 3 Fax",
        "0x0004": "T6/Group 4 Fax",
        "0x0005": "LZW",
        "0x0006": "JPEG (old-style)",
        "0x0007": "JPEG",
        "0x0008": "Adobe Deflate",
        "0x0009": "JBIG B&W",
        "0x000a": "JBIG Color",
        "0x0063": "JPEG",
        "0x0106": "Kodak 262",
        "0x7ffe": "Next",
        "0x7fff": "Sony ARW Compressed",
        "0x8001": "Packed RAW",
        "0x8002": "Samsung SRW Compressed",
        "0x8003": "CCIRLEW",
        "0x8004": "Samsung SRW Compressed 2",
        "0x8005": "PackBits",
        "0x8029": "Thunderscan",
        "0x8063": "Kodak KDC Compressed",
        "0x807f": "IT8CTPAD",
        "0x8080": "IT8LW",
        "0x8081": "IT8MP",
        "0x8082": "IT8BL",
        "0x808c": "PixarFilm",
        "0x808d": "PixarLog",
        "0x80b2": "Deflate",
        "0x80b3": "DCS",
        "0x80eb": "Aperio JPEG 2000 YCbCr",
        "0x80ed": "Aperio JPEG 2000 RGB",
        "0x8765": "JBIG",
        "0x8774": "SGILog",
        "0x8775": "SGILog24",
        "0x8798": "JPEG 2000",
        "0x8799": "Nikon NEF Compressed",
        "0x879b": "JBIG2 TIFF FX",
        "0x879e": "Microsoft Document Imaging (MDI) Binary Level Codec",
        "0x879f": "Microsoft Document Imaging (MDI) Progressive Transform Codec",
        "0x87a0": "Microsoft Document Imaging (MDI) Vector",
        "0x8847": "rootESRI Lerc",
        "0x884c": "Lossy JPEG",
        "0x886d": "LZMA2",
        "0x886e": "Zstd",
        "0x886f": "WebP",
        "0x8875": "PNG",
        "0x8876": "JPEG XR",
        "0xfde8": "Kodak DCR Compressed",
        "0xffff": "Pentax PEF Compressed"
      }},
      "0x0106": { name: "PhotometricInterpretation", fmt: "h", print: {
        "0x0000": "WhiteIsZero",
        "0x0001": "BlackIsZero",
        "0x0002": "RGB",
        "0x0003": "RGB Palette",
        "0x0004": "Transparency Mask",
        "0x0005": "CMYK",
        "0x0006": "YCbCr",
        "0x0008": "CIELab",
        "0x0009": "ICCLab",
        "0x000a": "ITULab",
        "0x8023": "Color Filter Array",
        "0x804c": "Pixar LogL",
        "0x804d": "Pixar LogLuv",
        "0x807c": "Sequential Color Filter",
        "0x884c": "Linear Raw",
        "0xc7e9": "Depth Map"
      }},
      "0x0107": { name: "Thresholding",  print: {
        "1": "No dithering or halftoning",
        "2": "Ordered dither or halftone",
        "3": "Randomized dither"
      }},
      "0x0108": { name: "CellWidth" },
      "0x0109": { name: "CellLength" },
      "0x010a": { name: "FillOrder", print: {
        "1": "Normal",
        "2": "Reversed"
      }},
      "0x010d": { name: "DocumentName" },
      "0x010e": { name: "ImageDescription" },
      "0x010f": { name: "Make" },
      "0x0110": { name: "Model" },
      "0x0111": { name: "PreviewImageStart" }, //strOffset
      "0x0112": { name: "Orientation", print: {
        "1": "Horizontal",
        "2": "Flip horizontal",
        "3": "Rotate 180º",
        "4": "Flip vertical",
        "5": "Flip horizontal, -90º",
        "6": "Rotate +90º",
        "7": "Flip horizontal, +90º",
        "8": "Rotate -90º"
      }},
      "0x0115": { name: "SamplesPerPixel" },
      "0x0116": { name: "RowsPerStrip" },
      "0x0117": { name: "PreviewImageLength" },
      "0x0118": { name: "MinSampleValue" },
      "0x0119": { name: "MaxSampleValue" },
      "0x011a": { name: "XResolution" },
      "0x011b": { name: "YResolution" },
      "0x011c": { name: "PlanarConfiguration", print: {
        "1": "Chunky",
        "2": "Planar"
      }},
      "0x011d": { name: "PageName" },
      "0x011e": { name: "XPosition" },
      "0x011f": { name: "YPosition" },
      "0x0122": { name: "GrayResponseUnit", print: {
        "1": "0.1",
        "2": "0.001",
        "3": "0.0001",
        "4": "1e-05",
        "5": "1e-06"
      }},
      "0x0128": { name: "ResolutionUnit", print: {
        "1": "None",
        "2": "inches",
        "3": "cm"
      }},
      "0x0129": { name: "PageNumber" }, //strOffset
      "0x012d": { name: "TransferFunction" },
      "0x0131": { name: "Software" },
      "0x0132": { name: "ModifyDate" },
      "0x013b": { name: "Artist" },
      "0x013c": { name: "HostComputer" },
      "0x013d": { name: "Predictor" },
      "0x013e": { name: "WhitePoint" }, //strOffset
      "0x013f": { name: "PrimaryChromaticities" }, //strOffset
      "0x0141": { name: "HalftoneHints" }, //strOffset
      "0x0142": { name: "TileWidth" },
      "0x0143": { name: "TileLength" },
      "0x014c": { name: "InkSet" },
      "0x0151": { name: "TargetPrinter" },
      "0x0201": { name: "ThumbnailOffset" },
      "0x0202": { name: "ThumbnailLength" },
      "0x0211": { name: "YCbCrCoefficients" }, //strOffset
      "0x0212": { name: "YCbCrSubSampling", print: function(v){
        return "YCbCr4:2:" + v[1] === 2 ? "0" : "2";
      }}, //strOffset
      "0x0213": { name: "YCbCrPositioning", print: {
        "1" : "centered",
        "2" : "co-sited"
      }},
      "0x0214": { name: "ReferenceBlackWhite" }, //strOffset
      "0x02bc": { name: "ApplicationNotes" },
      "0x4746": { name: "Rating" },
      "0x4749": { name: "RatingPercent" },
      "0x8298": { name: "Copyright" },
      "0x830e": { name: "PixelScale" }, //strOffset
      "0x83bb": { name: "IPTC-NAA" },
      "0x8480": { name: "IntergraphMatrix" }, //strOffset
      "0x8482": { name: "ModelTiePoint" }, //strOffset
      "0x8546": { name: "SEMInfo" },
      "0x85d8": { name: "ModelTransform" }, //strOffset
      "0x8649": { name: "PhotoshopSettings" }, //strOffset
      "0x8773": { name: "ICC_Profile" }, //strOffset
      "0x87af": { name: "GeoTiffDirectory" }, //strOffset
      "0x87b0": { name: "GeoTiffDoubleParams" },
      "0x87b1": { name: "GeoTiffAsciiParams" },
      "0x935c": { name: "ImageSourceData" }, //strOffset
      "0x9c9b": { name: "XPTitle" },
      "0x9c9c": { name: "XPComment" },
      "0x9c9d": { name: "XPAuthor" },
      "0x9c9e": { name: "XPKeywords" },
      "0x9c9f": { name: "XPSubject" },
      "0xa002": { name: "ExifImageWidth" },
      "0xa003": { name: "ExifImageLength" },
      "0xa480": { name: "GDALMetadata" },
      "0xa481": { name: "GDALNoData" },
      "0xc4a5": { name: "PrintIM" }, //strOffset
      "0xc612": { name: "DNGVersion" }, //strOffset
      "0xc613": { name: "DNGBackwardVersion" }, //strOffset
      "0xc614": { name: "UniqueCameraModel" },
      "0xc615": { name: "LocalizedCameraModel" },
      "0xc621": { name: "ColorMatrix1" }, //strOffset
      "0xc622": { name: "ColorMatrix2" }, //strOffset
      "0xc623": { name: "CameraCalibration1" }, //strOffset
      "0xc624": { name: "CameraCalibration2" }, //strOffset
      "0xc625": { name: "ReductionMatrix1" }, //strOffset
      "0xc626": { name: "ReductionMatrix2" }, //strOffset
      "0xc627": { name: "AnalogBalance" }, //strOffset
      "0xc628": { name: "AsShotNeutral" }, //strOffset
      "0xc629": { name: "AsShotWhiteXY" }, //strOffset
      "0xc62a": { name: "BaselineExposure" },
      "0xc62b": { name: "BaselineNoise" },
      "0xc62c": { name: "BaselineSharpness" },
      "0xc62e": { name: "LinearResponseLimit" },
      "0xc62f": { name: "CameraSerialNumber" },
      "0xc630": { name: "DNGLensInfo" }, //strOffset
      "0xc633": { name: "ShadowScale" },
      "0xc634": { name: "SR2Private" }, //strOffset
      "0xc635": { name: "MakerNoteSafety", print: {
        "0": "Unsafe",
        "1": "Safe"
      }},
      "0xc65a": { name: "CalibrationIlluminant1", print: {
        "1": "Daylight",
        "2": "Fluorescent",
        "3": "Tungsten",
        "4": "Flash",
        "9": "Fine Weather",
        "10": "Cloudy",
        "11": "Shade",
        "12": "Daylight Fluorescent",
        "13": "Day White Fluorescent",
        "14": "Cool White Fluorescent",
        "15": "White Fluorescent",
        "17": "Standard Light A",
        "18": "Standard Light B",
        "19": "Standard Light C",
        "20": "D55",
        "21": "D65",
        "22": "D75",
        "23": "D50",
        "24": "ISO Studio Tungsten",
        "255": "Other",
      }},
      "0xc65b": { name: "CalibrationIlluminant2", print: {
        "1": "Daylight",
        "2": "Fluorescent",
        "3": "Tungsten",
        "4": "Flash",
        "9": "Fine Weather",
        "10": "Cloudy",
        "11": "Shade",
        "12": "Daylight Fluorescent",
        "13": "Day White Fluorescent",
        "14": "Cool White Fluorescent",
        "15": "White Fluorescent",
        "17": "Standard Light A",
        "18": "Standard Light B",
        "19": "Standard Light C",
        "20": "D55",
        "21": "D65",
        "22": "D75",
        "23": "D50",
        "24": "ISO Studio Tungsten",
        "255": "Other",
      }},
      "0xc65d": { name: "RawDataUniqueID" }, //strOffset
      "0xc68b": { name: "OriginalRawFileName" },
      "0xc68c": { name: "OriginalRawFileData" }, //strOffset
      "0xc68f": { name: "AsShotICCProfile" }, //strOffset
      "0xc690": { name: "AsShotPreProfileMatrix" }, //strOffset
      "0xc691": { name: "CurrentICCProfile" }, //strOffset
      "0xc692": { name: "CurrentPreProfileMatrix" }, //strOffset
      "0xc6bf": { name: "ColorimetricReference" },
      "0xc6c5": { name: "SRawType" }, //strOffset
      "0xc6d2": { name: "PanasonicTitle" }, //strOffset
      "0xc6d3": { name: "PanasonicTitle2" }, //strOffset
      "0xc6f3": { name: "CameraCalibrationSig" },
      "0xc6f4": { name: "ProfileCalibrationSig" },
      "0xc6f5": { name: "ProfileIFD" }, //strOffset
      "0xc6f6": { name: "AsShotProfileName" },
      "0xc6f8": { name: "ProfileName" },
      "0xc6f9": { name: "ProfileHueSatMapDims" }, //strOffset
      "0xc6fa": { name: "ProfileHueSatMapData1" }, //strOffset
      "0xc6fb": { name: "ProfileHueSatMapData2" }, //strOffset
      "0xc6fc": { name: "ProfileToneCurve" }, //strOffset
      "0xc6fd": { name: "ProfileEmbedPolicy" },
      "0xc6fe": { name: "ProfileCopyright" },
      "0xc714": { name: "ForwardMatrix1" }, //strOffset
      "0xc715": { name: "ForwardMatrix2" }, //strOffset
      "0xc716": { name: "PreviewApplicationName" },
      "0xc717": { name: "PreviewApplicationVersion" },
      "0xc718": { name: "PreviewSettingsName" },
      "0xc719": { name: "PreviewSettingsDigest" },
      "0xc71a": { name: "PreviewColorSpace" },
      "0xc71b": { name: "PreviewDateTime" },
      "0xc71c": { name: "RawImageDigest" }, //strOffset
      "0xc71d": { name: "OriginalRawFileDigest" }, //strOffset
      "0xc725": { name: "ProfileLookTableDims" }, //strOffset
      "0xc726": { name: "ProfileLookTableData" }, //strOffset
      "0xc763": { name: "TimeCodes" }, //strOffset
      "0xc764": { name: "FrameRate" },
      "0xc772": { name: "TStop" }, //strOffset
      "0xc789": { name: "ReelName" },
      "0xc791": { name: "OriginalDefaultFinalSize" }, //strOffset
      "0xc792": { name: "OriginalBestQualitySize" }, //strOffset
      "0xc793": { name: "OriginalDefaultCropSize" }, //strOffset
      "0xc7a1": { name: "CameraLabel" },
      "0xc7a3": { name: "ProfileHueSatMapEncoding" },
      "0xc7a4": { name: "ProfileLookTableEncoding" },
      "0xc7a5": { name: "BaselineExposureOffset" },
      "0xc7a6": { name: "DefaultBlackRender" },
      "0xc7a7": { name: "NewRawImageDigest" }, //strOffset
      "0xc7a8": { name: "RawToPreviewGain" }, //strOffset
      "0xc7e9": { name: "DepthFormat" },
      "0xc7ea": { name: "DepthNear" },
      "0xc7eb": { name: "DepthFar" },
      "0xc7ec": { name: "DepthUnits" },
      "0xc7ed": { name: "DepthMeasureType" },
      "0xc7ee": { name: "EnhanceParams" }
    }
  }

  IFD_EXIF = {
    keys: {
      "0x1000": { name: "RelatedImageFileFormat" },
      "0x1001": { name: "RelatedImageWidth" },
      "0x1002": { name: "RelatedImageHeight" },
      "0x829a": { name: "ExposureTime" },
      "0x829d": { name: "FNumber" },
      "0x8822": { name: "ExposureProgram", print: {
        "0": "Not Defined",
        "1": "Manual",
        "2": "Program AE",
        "3": "Aperture-priority AE",
        "4": "Shutter speed priority AE",
        "5": "Creative (Slow speed)",
        "6": "Action (High speed)",
        "7": "Portrait",
        "8": "Landscape",
        "9": "Bulb",
      }},
      "0x8824": { name: "SpectralSensitivity" },
      "0x8827": { name: "ISO" },
      "0x882a": { name: "TimeZoneOffset" },
      "0x882b": { name: "SelfTimerMode" },
      "0x8830": { name: "SensitivityType" },
      "0x8831": { name: "StandardOutputSensitivity" },
      "0x8832": { name: "RecommendedExposureIndex" },
      "0x8833": { name: "ISOSpeed" },
      "0x8834": { name: "ISOSpeedLatitudeyyy" },
      "0x8835": { name: "ISOSpeedLatitudezzz" },
      "0x9000": { name: "ExifVersion", print: function(val){
        return String.fromCharCode.apply(String, DataReader.uint32toUint8Array(val))
      }},
      "0x9003": { name: "DateTimeOriginal" },
      "0x9004": { name: "CreateDate" },
      "0x9009": { name: "GooglePlusUploadCode" },
      "0x9010": { name: "OffsetTime" },
      "0x9011": { name: "OffsetTimeOriginal" },
      "0x9012": { name: "OffsetTimeDigitized" },
      "0x9101": { name: "ComponentsConfiguration", print: function(val){
        const components = [ "-","Y","Cb","Cr","B","G","R" ];
        var out;
        for (let i = 0; i < 4; i++){
          out += components[(val >> i) & 0x7];
        }
        return out;
      }},
      "0x9102": { name: "CompressedBitsPerPixel" },
      "0x9201": { name: "ShutterSpeedValue" },
      "0x9202": { name: "ApertureValue" },
      "0x9203": { name: "BrightnessValue" },
      "0x9204": { name: "ExposureCompensation" },
      "0x9205": { name: "MaxApertureValue" },
      "0x9206": { name: "SubjectDistance" },
      "0x9207": { name: "MeteringMode", print: {
        "0": "Unknown",
        "1": "Average",
        "2": "Center-weighted average",
        "3": "Spot",
        "4": "Multi-spot",
        "5": "Multi-segment",
        "6": "Partial",
        "255": "Other",
      }},
      "0x9208": { name: "LightSource", print: {
        "1": "Daylight",
        "2": "Fluorescent",
        "3": "Tungsten",
        "4": "Flash",
        "9": "Fine Weather",
        "10": "Cloudy",
        "11": "Shade",
        "12": "Daylight Fluorescent",
        "13": "Day White Fluorescent",
        "14": "Cool White Fluorescent",
        "15": "White Fluorescent",
        "17": "Standard Light A",
        "18": "Standard Light B",
        "19": "Standard Light C",
        "20": "D55",
        "21": "D65",
        "22": "D75",
        "23": "D50",
        "24": "ISO Studio Tungsten",
        "255": "Other",
      }},
      "0x9209": { name: "Flash", fmt: "h", print: {
        "0x0000": "No Flash",
        "0x0001": "Fired",
        "0x0005": "Fired, return not detected",
        "0x0007": "Fired, return detected",
        "0x0008": "On, Did not fire",
        "0x0009": "On, Fired",
        "0x000d": "On, return not detected",
        "0x000f": "On, return  detected",
        "0x0010": "Off, Did not fire",
        "0x0014": "Off, Did not fire, return not detected",
        "0x0018": "Auto, Did not fire",
        "0x0019": "Auto, Fired",
        "0x001d": "Auto, Fired, return not detected",
        "0x001f": "Auto, Fired, return detected",
        "0x0020": "No flash function",
        "0x0030": "Off, No flash function",
        "0x0041": "Fired, Red-eye reduction",
        "0x0045": "Fired, Red-eye reduction, return not detected",
        "0x0047": "Fired, Red-eye reduction, return detected",
        "0x0049": "On, Red-eye reduction",
        "0x004d": "On, Red-eye reduction, return not detected",
        "0x004f": "On, Red-eye reduction, return detected",
        "0x0050": "Off, Red-eye reduction",
        "0x0058": "Auto, Did not fire, Red-eye reduction",
        "0x0059": "Auto, Fired, Red-eye reduction",
        "0x005d": "Auto, Fired, Red-eye reduction, return not detected",
        "0x005f": "Auto, Fired, Red-eye reduction, return detected",
      }},
      "0x920a": { name: "FocalLength" },
      "0x9211": { name: "ImageNumber" },
      "0x9212": { name: "SecurityClassification", print: {
        "C": "Confidential",
        "R": "Restricted",
        "S": "Secret",
        "T": "Top Secret",
        "U": "Unclassified"
      }},
      "0x9213": { name: "ImageHistory" },
      "0x9214": { name: "SubjectArea" },
      "0x927c": { name: "makerNoteProprietary" },
      "0x9286": { name: "UserComment" },
      "0x9290": { name: "SubSecTime" },    
      "0x9291": { name: "SubSecTimeOriginal" },
      "0x9292": { name: "SubSecTimeDigitized" },
      "0x9400": { name: "AmbientTemperature" },
      "0x9401": { name: "Humidity" },
      "0x9402": { name: "Pressure" },
      "0x9403": { name: "WaterDepth" },
      "0x9404": { name: "Acceleration" },
      "0x9405": { name: "CameraElevationAngle" },
      "0x9999": { name: "Vendor data" },
      "0xa000": { name: "FlashpixVersion", print: function(val){
        return String.fromCharCode.apply(String, DataReader.uint32toUint8Array(val))
      }},
      "0xa001": { name: "ColorSpace", fmt: "h",  print: {
        "0x0001": "sRGB",
        "0x0002": "Adobe RGB",
        "0xfffd": "Wide Gamut RGB",
        "0xfffe": "ICC Profile",
        "0xffff": "Uncalibrated"
      }},
      "0xa002": { name: "ExifImageWidth" },    
      "0xa003": { name: "ExifImageHeight" },
      "0xa004": { name: "RelatedSoundFile" },
      "0xa20b": { name: "FlashEnergy" },
      "0xa20e": { name: "FocalPlaneXResolution" },
      "0xa20f": { name: "FocalPlaneYResolution" },
      "0xa210": { name: "FocalPlaneResolutionUnit", print: {
        "1": "None",
        "2": "inches",
        "3": "cm",
        "4": "mm",
        "5": "um"
      }},
      "0xa214": { name: "SubjectLocation" },
      "0xa215": { name: "ExposureIndex" },
      "0xa217": { name: "SensingMethod", print: {
        "1": "Not defined",
        "2": "One-chip color area",
        "3": "Two-chip color area",
        "4": "Three-chip color area",
        "5": "Color sequential area",
        "7": "Trilinear",
        "8": "Color sequential linear",
      }},
      "0xa300": { name: "FileSource", print: {
        "1": "Film Scanner",
        "2": "Reflection Print Scanner",
        "3": "Digital Camera"
      }},
      "0xa301": { name: "SceneType", print: {
        "1": "Directly photographed"
      }},
      "0xa302": { name: "CFAPattern" },
      "0xa401": { name: "CustomRendered", print: {
        "0": "Normal",
        "1": "Custom",
        "2": "HDR (no original saved)",
        "3": "HDR (original saved)",
        "4": "Original (for HDR)",
        "5": "cm",
        "6": "Panorama",
        "7": "Portrait HDR",
        "8": "Portrait",
      }},
      "0xa402": { name: "ExposureMode", print: {
        "0": "Auto",
        "1": "Manual",
        "2": "Auto bracket"
      }},
      "0xa403": { name: "WhiteBalance", print: {
        "0": "Auto",
        "1": "Manual"
      }},
      "0xa404": { name: "DigitalZoomRatio" },
      "0xa405": { name: "FocalLengthIn35mmFormat" },
      "0xa406": { name: "SceneCaptureType", print: {
        "0": "Standard",
        "1": "Landscape",
        "2": "Portrait",
        "3": "Night",
        "4": "Other",
      }},
      "0xa407": { name: "GainControl", print: {
        "0": "None",
        "1": "Low gain up",
        "2": "High gain up",
        "3": "Low gain down",
        "4": "High gain down",
      }},
      "0xa408": { name: "Contrast", print:{
        "0": "Normal",
        "1": "Low",
        "2": "High",
      } },
      "0xa409": { name: "Saturation", print:{
        "0": "Normal",
        "1": "Low",
        "2": "High",
      } },
      "0xa40a": { name: "Sharpness", print:{
        "0": "Normal",
        "1": "Soft",
        "2": "Hard",
      } },
      "0xa40c": { name: "SubjectDistanceRange", print: {
        "0": "Unknown",
        "1": "Macro",
        "2": "Close",
        "3": "Distant",
      }},
      "0xa420": { name: "ImageUniqueID" },
      "0xa430": { name: "OwnerName" },
      "0xa431": { name: "SerialNumber" },
      "0xa432": { name: "LensInfo" },
      "0xa433": { name: "LensMake" },
      "0xa434": { name: "LensModel" },
      "0xa435": { name: "LensSerialNumber" },
      "0xa460": { name: "CompositeImage", print: {
        "0": "Unknown",
        "1": "Not a Composite Image",
        "2": "General Composite Image",
        "3": "Composite Image Captured While Shooting",
      }},
      "0xa461": { name: "CompositeImageCount" },
      "0xa462": { name: "CompositeImageExposureTimes" },
      "0xa500": { name: "Gamma" },
      "0xea1c": { name: "Padding" },
      "0xea1d": { name: "OffsetSchema" },
      "0xfde8": { name: "OwnerName" },
      "0xfde9": { name: "SerialNumber" },
      "0xfdea": { name: "Lens" },
      "0xfe4c": { name: "RawFile" },
      "0xfe4d": { name: "Converter" },
      "0xfe4e": { name: "WhiteBalance", print:{
        "0x0000": "Auto",
        "0x0001": "Manual",
      }},
      "0xfe51": { name: "Exposure", print: {
        "0": "Auto",
        "1": "Manual",
        "2": "Auto bracket"
      }},
      "0xfe52": { name: "Shadows" },
      "0xfe53": { name: "Brightness" },
      "0xfe54": { name: "Contrast", print:{
        "0": "Normal",
        "1": "Low",
        "2": "High",
      }},
      "0xfe55": { name: "Saturation", print:{
        "0": "Normal",
        "1": "Low",
        "2": "High",
      }},
      "0xfe56": { name: "Sharpness", print:{
        "0": "Normal",
        "1": "Soft",
        "2": "Hard",
      }},
      "0xfe57": { name: "Smoothness" },
      "0xfe58": { name: "MoireFilter" },
    },
    printVersion: function(val){
      return String.fromCharCode.apply(String, DataReader.uint32toUint8Array(val))
    },
  }
  
  IFD_INTEROP = {
    keys: {
      "0x0001": { name: "InteropIndex", print: {
        "R03": "R03 - DCF option file (Adobe RGB)",
        "R98": "R98 - DCF basic file (sRGB)",
        "THM": "THM - DCF thumbnail file"
      }},
      "0x0002": { name: "InteropVersion", print: function(val){
        return String.fromCharCode.apply(String, DataReader.uint32toUint8Array(val))
      }},
      "0x1000": { name: "RelatedImageFileFormat" },
      "0x1001": { name: "RelatedImageWidth" },
      "0x1002": { name: "RelatedImageLength" }
    }
  }

  IFD = {
    subtables: {
      "0x8825": { name: "GPS", table: this.IFD_GPS },
      "0x8769": { name: "EXIF", table: this.IFD_EXIF },
      "0x014a": { name: "SubIFD", table: this.IFD_IFD0 },
      "0x0190": { name: "GlobalParametersIFD", table: this.IFD_IFD0 },
      "0x4748": { name: "StitchInfo", table: this.IFD_IFD0 },
      "0x8290": { name: "KodakIFD", table: this.IFD_IFD0 },
      "0x888a": { name: "LeafSubIFD", table: this.IFD_IFD0 },
      "0xa005": { name: "InteropOffset", table: this.IFD_INTEROP },
      "0xc7d5": { name: "NikonNEFInfo", table: this.IFD_IFD0 },
      "0xfe00": { name: "KDC_IFD", table: this.IFD_IFD0 },
    },

    add: function(self, r, table, root, name, startOffset, offset){
      r.pushOffset(startOffset + offset)
      let out = {
        count: r.readUInt16(),
        nextOffset: 0
      };
      for (let i = 0; i < out.count; i++){
        let ifd = self.ifd_entry.read(r);
        let sub = this.subtables[r.strHex(ifd.tag,4)];
        if (sub === undefined){
          let data = self.ifd_entry.print(r, table, startOffset, ifd);
          let id = config.splitItemTitle && (typeof data.value != 'object')
            ? data.name + "|" + (data.desc || data.value)
            : data.name
          out[id] = data;
        } else {
          console.log("switching to subtable " + sub.name);
          this.add(self, r, sub.table, root, sub.name, startOffset, ifd.value);
          console.log("subtable " + sub.name + " done");
        }
      }
      out.nextOffset = r.readUInt32();
      root[name] = out;
  
      if (out.nextOffset > 0)
        this.add(self, r, table, root, name, startOffset, out.nextOffset);
      
      r.popOffset();
    }
  }

  ifd_entry = {
    format: {
      "0" : { name: "error!", get: function(){
        return 0;
      }},
      "1" : {
        name: "uint8, unsigned byte",
        get: function(r, tableOffset, ifd){
          return ifd.components === 1 
            ? r.parseUInt8(ifd.value)
            : ifd.components < 5
            ? r.arrayOf(ifd.value, ifd.components, 32)
            : r.readUInt8ArrayAt(tableOffset + ifd.value, ifd.components);
      }},
      "2" : {
        name: "string",
        get: function(r, tableOffset, ifd){
          if (ifd.components < 5)
            return String.fromCharCode.apply(String, r.arrayOf(ifd.value, ifd.components, 32));
          let str = r.readStringAt(tableOffset + ifd.value, ifd.components-1);
          return str.charAt(0) == "{" ? JSON.parse(str) : str;
      }},
      "3" : {
        name: "uint16, unsigned short",
        get: function(r, tableOffset, ifd){
          return ifd.components === 1 
            ? r.uint32to16(ifd.value)
            : r.readUInt16ArrayAt(tableOffset + ifd.value, ifd.components);
      }},
      "4" : {
        name: "uint32, unsigned long",
        get: function(r, tableOffset, ifd){
          return ifd.components === 1
            ? r.parseUInt32(ifd.value)
            : r.readUInt32ArrayAt(tableOffset + ifd.value, ifd.components);
      }},
      "5" : {
        name: "uint32/uint32, unsigned rational",
        get: function(r, tableOffset, ifd){
          if (ifd.components === 1)
            return r.readURationalAt(tableOffset + ifd.value);
          let out = [];
          for (let i = 0 ; i < ifd.components ; i++)
            out.push(r.readURationalAt(tableOffset + ifd.value + 8 * i));
          return out;
      }},
      "6" : {
        name: "int8, signed byte",
        get: function(r, tableOffset, ifd){
          return ifd.components === 1
            ? r.parseInt8(ifd.value)
            : r.readInt8ArrayAt(tableOffset + ifd.value, ifd.components);
      }},
      "7" : {
        name: "(undefined)",
        get: function(r, tableOffset, ifd){
          return ifd.value;
      }},
      "8" : {
        name: "int16, signed short",
        get: function(r, tableOffset, ifd){
          return ifd.components === 1 
          ? r.parseInt16(ifd.value)
          : r.readInt16ArrayAt(tableOffset + ifd.value, ifd.components);
      }},
      "9" : {
        name: "int32, signed long",
        get: function(r, tableOffset, ifd){
          return ifd.components === 1 
            ? r.parseInt32(ifd.value)
            : r.readInt32ArrayAt(tableOffset + ifd.value, ifd.components);
      }},
      "10" : {
        name: "int32/int32, signed rational",
        get: function(r, tableOffset, ifd){tableOffset
          if (ifd.components === 1)
            return r.readRationalAt(tableOffset + ifd.value);
          let out = [];
          for (let i = 0 ; i < ifd.components ; i++)
            out.push(r.readRationalAt(tableOffset + ifd.value + 8 * i));
          return out;
      }}
    },
    read: function(r){
      return {
        tag: r.readUInt16(),
        format: r.readUInt16(),
        components: r.readUInt32(),
        value: r.readUInt32()
      }
    },
    printIfd: function(r, ifd){
      let ifdFormat = this.format[ifd.format];
      let data = {
        tag: r.strHex(ifd.tag, 4),
        format: ifd.format
      }
      if (!ifdFormat)
        return data;
      data.format = ifdFormat.name;
      if (ifd.components > 1){
        data.size = ifd.components;
        data.offset = ifd.value;
        if (ifd.format != 2)
          data.format += " (array)"
      } else {
        data.components = 1
        data.value = r.strHex(ifd.value);
      }
      return data;
    },
    print: function(r, table, tableOffset, ifd){
      let out = {
        ".data": this.printIfd(r, ifd)
      }
      let id = r.strHex(ifd.tag, 4)
      let k;
      out.value = this.format[ifd.format].get(r, tableOffset, ifd);
      if (table !== undefined && (k = table.keys[id]) !== undefined){
        out.name = k.name;
        if (k.print){
          if (typeof k.print === 'object'){
            let v = k.fmt == "h" ? r.strHex(out.value,4) : out.value;
            out.desc = k.print[v];
          } else {
            out.desc = k.print(out.value);
          }
          
        }
        console.log("ifd tag:" + id + " name: " + k.name + " format:"+ifd.format + " value:" + out.value + " desc:" + out.desc);
      } else {
        out.name = "unknown " + id;
        console.log("unknown tag:" + id + " value: " + out.value + " format: " + ifd.format);
      };
      
      return out;
    }
  }
}

class MetadataJPEG {

  constructor(dataReader){
    this.datareader = dataReader;
    this.metadata = {};
    this.load(dataReader);
  }

  load(r){
    r.pushOffset(0);
    r.le =false;
    let m = this.getMark(r);
    if (m === undefined || m.tag != 'SOI') {
      this.metadata.SOI = "invalid jpeg " + (m === null ? "" : m.id);
      return;
    }
    this.metadata[m.tag] = m;
    while ((m = this.getMark(r)) && m.offset < r.source.byteLength){
      this.metadata[m.tag] = m;
      r.offset = m.offset + m.size + 2;
    }
    r.popOffset();
  }

  jpegMarks = {
    "0xffc0": { tag: "SOF0",  dsc: "start of frame 0 Baseline DCT", load: this.SOFn },
    "0xffc1": { tag: "SOF1",  dsc: "start of frame 1 Extended Sequential DCT, Huffman", load: this.SOFn },
    "0xffc2": { tag: "SOF2",  dsc: "start of frame 2 Progressive DCT, Huffman)", load: this.SOFn },
    "0xffc3": { tag: "SOF3",  dsc: "start of frame 3 Lossless (sequential), Huffman", load: this.SOFn },
    "0xffc4": { tag: "DHT",   dsc: "start of frame 4 SOF4/DHT - Define Huffman Tables", load: this.DHT},
    "0xffc5": { tag: "SOF5",  dsc: "start of frame 5 Differential sequential DCT, Huffman", load: this.SOFn },
    "0xffc6": { tag: "SOF6",  dsc: "start of frame 6 Differential progressive DCT, Huffman", load: this.SOFn },
    "0xffc7": { tag: "SOF7",  dsc: "start of frame 7 Differential Lossless (sequential), Huffman", load: this.SOFn },
    "0xffc8": { tag: "JPG",   dsc: "start of frame 8 reserved for JPEG extension", load: this.SOFn },
    "0xffc9": { tag: "SOF9",  dsc: "start of frame 9 Extended sequential DCT, Arithmetic coding", load: this.SOFn },
    "0xffca": { tag: "SOF10", dsc: "start of frame 10 Progressive DCT, Arithmetic coding", load: this.SOFn },
    "0xffcb": { tag: "SOF11", dsc: "start of frame 11 (lossless, arithmetic)", load: this.SOFn },
    "0xffcc": { tag: "DAC",   dsc: "start of frame 12 SOF10/DAC - Define Arithmetic Coding conditioning", load: this.SOFn },
    "0xffcd": { tag: "SOF13", dsc: "start of frame 13 differential sequential, arithmetic:", load: this.SOFn },
    "0xffce": { tag: "SOF14", dsc: "start of frame 14 differential progressive, arithmetic", load: this.SOFn },
    "0xffcf": { tag: "SOF15", dsc: "start of frame 15 differential lossless, arithmetic", load: this.SOFn },
    "0xffd0": { tag: "RST0",  dsc: "restart marker 0" },
    "0xffd1": { tag: "RST1",  dsc: "restart marker 1" },
    "0xffd2": { tag: "RST2",  dsc: "restart marker 2" },
    "0xffd3": { tag: "RST3",  dsc: "restart marker 3" },
    "0xffd4": { tag: "RST4",  dsc: "restart marker 4" },
    "0xffd5": { tag: "RST5",  dsc: "restart marker 5" },
    "0xffd6": { tag: "RST6",  dsc: "restart marker 6" },
    "0xffd7": { tag: "RST7",  dsc: "restart marker 7" },
    "0xffd8": { tag: "SOI",   dsc: "start of image" },
    "0xffd9": { tag: "EOI",   dsc: "end of image" },
    "0xffda": { tag: "SOS",   dsc: "start of scan" },
    "0xffdb": { tag: "DQT",   dsc: "define quantization table(s)", load: this.DQT },
    "0xffdc": { tag: "DNL",   dsc: "define number of lines" },
    "0xffdd": { tag: "DRI",   dsc: "define restart interval" },
    "0xffde": { tag: "DHP",   dsc: "define hierarchical progression" },
    "0xffdf": { tag: "EXP",   dsc: "expand reference components" },
    "0xffe0": { tag: "APP0",  dsc: "application segment 0 (JFIF/JFXX/AVI MJPEG)", load: this.APPn },
    "0xffe1": { tag: "APP1",  dsc: "application segment 1 (EXIF/XMP/XAP ?)", load: this.APPn },
    "0xffe2": { tag: "APP2",  dsc: "application segment 2 (FlashPix / ICC)", load: this.APPn },
    "0xffe3": { tag: "APP3",  dsc: "application segment 3 (Kodak/...)", load: this.APPn },
    "0xffe4": { tag: "APP4",  dsc: "application segment 4 (FlashPix/...)", load: this.APPn },
    "0xffe5": { tag: "APP5",  dsc: "application segment 5 (Ricoh...)", load: this.APPn },
    "0xffe6": { tag: "APP6",  dsc: "application segment 6 (GoPro...)", load: this.APPn },
    "0xffe7": { tag: "APP7",  dsc: "application segment 7 (Pentax/Qualcomm)", load: this.APPn },
    "0xffe8": { tag: "APP8",  dsc: "application segment 8 (Spiff)", load: this.APPn },
    "0xffe9": { tag: "APP9",  dsc: "application segment 9 (MediaJukebox)", load: this.APPn },
    "0xffea": { tag: "APP10", dsc: "application segment 10 (PhotoStudio)", load: this.APPn },
    "0xffeb": { tag: "APP11", dsc: "application segment 11 (HDR)", load: this.APPn },
    "0xffec": { tag: "APP12", dsc: "application segment 12 (photoshoP ducky / save for web)", load: this.APPn },
    "0xffed": { tag: "APP13", dsc: "application segment 13 (photoshoP save as)", load: this.APPn },
    "0xffee": { tag: "APP14", dsc: "application segment 14 (adobe)", load: this.APPn },    // JPEG 2000
    "0xffef": { tag: "APP15", dsc: "application segment 15 (GraphicConverter)", load: this.APPn },
    "0xfff0": { tag: "JPG0",  dsc: "extension data 00", load: this.JPGn },
    "0xfff1": { tag: "JPG1",  dsc: "extension data 01", load: this.JPGn },
    "0xfff2": { tag: "JPG2",  dsc: "extension data 02", load: this.JPGn },
    "0xfff3": { tag: "JPG3",  dsc: "extension data 03", load: this.JPGn },
    "0xfff4": { tag: "JPG4",  dsc: "extension data 04", load: this.JPGn },
    "0xfff5": { tag: "JPG5",  dsc: "extension data 05", load: this.JPGn },
    "0xfff6": { tag: "JPG6",  dsc: "extension data 06", load: this.JPGn },
    "0xfff7": { tag: "SOF48", dsc: "start of frame 48 (jpeg-ls)", load: this.SOFn },
    "0xfff8": { tag: "LSE",   dsc: "extension parameters (jpeg-ls)" },
    "0xfff9": { tag: "JPG9",  dsc: "extension data 09", load: this.JPGn },
    "0xfffa": { tag: "JPG10", dsc: "extension data 10", load: this.JPGn },
    "0xfffb": { tag: "JPG11", dsc: "extension data 11", load: this.JPGn },
    "0xfffc": { tag: "JPG12", dsc: "extension data 12", load: this.JPGn },
    "0xfffd": { tag: "JPG13", dsc: "extension data 13", load: this.JPGn },
    "0xfffe": { tag: "COM",   dsc: "extension data, comment" },
  }

  getMark(r){
    let m = {
      tag: '---',
      dsc: 'Unknown',
      offset: r.offset,
      id: r.readUInt16()
    };
    m.id = r.strHex(m.id);
    let n = this.jpegMarks[m.id];
    if (n){
      m.tag = n.tag;
      m.dsc = n.dsc;
      if (n.load)
        n.load(r, m, this);
    }
    return m;
  }

  DHT(r, m){
    m.size = r.readUInt16(); 
    r.readUInt4(m, "identifier", "class");
    m.codes = r.readUInt8Array(16);
  }
  
  SOFn(r, m, self){
    r.addUInt16(m, "size");
    r.addUInt8(m, "samplePrecision");
    r.addUInt16(m, "nlines","samplesperline");
    r.addUInt8(m, "componentsinframe");
    m.dctFrames = [];
    for (let i = 0 ; i < m.componentsinframe ; i++)
      m.dctFrames.push(self.dct_frame(r));
  }
  
  dct_frame(r){
    let dct = {};
    dct.id = r.readUInt8(),
    r.readUInt4(dct, "verticalSampleFactor", "horizontalSampleFactor");
    dct.quantizationTableDestSelector = r.readUInt8();
    return dct;
  }

  DQT(r, m){
    r.addUInt16(m, "size");
    r.readUInt4(m, "identifier", "precision");
    m.table = r.readUInt8Array(64);
  }
  
  JPGn(r, m){
    let n = m.id & 0x0f;
    return {
      tag: 'JPG' + n,
      dsc: 'JPEG Extension ' + n,
      id: m.id,
      offset: m.offset,
      size: m.size
    }
  }

  APPn(r, m, self){
    m.size = r.readUInt16();
    let tag = r.readString();
    r.skip(1);
    m.tag += " " + tag;
    switch (tag) {
      case "JFIF": self.JFIF(r, m); break;
      case "JFXX": self.JFXX(r, m); break;
      //case "Exif": self.Exif(r, m); break;
      case "Exif":
        let exif = new MetadataEXIF(r, r.offset);
        m.EXIF = exif.metadata;
        break;
      case "TIFF": self.TIFF(r, m); break;
      case "XMP ": self.XMP(r, m); break;
      case "ICC_PROFILE":
        let icc = new MetadataICC(r, r.offset - 1);
        m.icc = icc.metadata;
        break;
    }
    r.offset = m.offset + m.size;
    return m;
  }

  JFIF(r, m){
    r.addUInt8(m, "versionMajor","versionMinor","units")
    r.addUInt16(m, "xDensity", "yDensity");
    r.addUInt8(m, "xThumbnail", "yThumbnail");
    m.thumbnailData = {
      offset: r.offset,
      size: 3 * m.xThumbnail * m.yThumbnail
    };
  }

  JFXX(r, m){
    m.extensionCode = r.readUInt8();
    m.thumbnailData = {
      offset: r.offset,
      size: m.size + (r.offset - m.offset)
    };
  }

  XMP(r, m){
    return;
  }

  TIFF(r, m){
    let byteOrder = r.readInt16();
    r.le = byteOrder == 0x4949;
    let header = {
      endianness: byteOrder,
      signature: r.readUInt16(),
      ifd0_offset: r.readUInt32()
    };
    m.TIFF = header;
    return header.signature === 0x002a;
  }
}

class MetadataICC {

  // ref https://www.color.org/icc32.pdf
  // ref https://exiftool.org/TagNames/ICC_Profile.html
  

  constructor(r, offset){
    this.metadata = {};
    this.reader = r;
    this.headerOffset = offset;
    r.pushByteOrder(false);
    r.pushOffset(offset);
    this.load(r, this.metadata);
    r.popOffset();
    r.popByteOrder();
  }

  load(r, meta){
    meta.headerOffset = r.offset;
    meta.icc_chunkcount = r.readUInt8();
    meta.icc_totalchunks = r.readUInt8();
    r.addUInt32(meta,
      "profileSize",
      "type");
    meta.version = this.version(r.readUInt32());
    meta.devClass = r.readString(4);
    meta.colorSpace = r.readString(4);
    meta.pcs = r.readString(4);
    meta.createtime = this.dateTimeNumber(r);
    meta.acsp = r.readString(4);
    r.addUInt32(meta,
      "ppsig",
      "pflags",
      "devmanf",
      "devmodel",
      "devattrs",
      "renderint"
    );
    meta.xyznumber = this.xyznumber(r);
    r.addUInt32(meta, "creatorsig");
    r.skip(48); // reserved (44?)
    
    meta.tags = {};
    //meta.tagsOffset = r.offset;
    let tagCount = r.readUInt32();
    //meta.tagCount = tagCount;
    for (let i = 0; i < tagCount; i++)
      this.addTag(r, meta.tags);
  }
  
  addTag(r, tags){
    let tag = {
      tag: r.readString(4),
      offset: r.readUInt32(),
      size: r.readUInt32()
    }
    r.pushOffset(this.headerOffset + tag.offset);
    tags[tag.tag] = tag;
    r.popOffset();
  }


  version(uint32){
    return (uint32 & 0xff) + "." + ((uint32 >> 8) & 0xff);
  }

  dateTimeNumber(r){
    let ret = {
      year: r.readUInt16(),
      month: r.readUInt16(),
      day: r.readUInt16(),
      hours: r.readUInt16(),
      minutes: r.readUInt16(),
      seconds: r.readUInt16()
    }
    let name = ret.year + "-" + ret.month + "-" + ret.day + " " + ret.hours + ":" + ret.minutes + ":" + ret.seconds;
    return { [name]: ret };
  }

  xyznumber(r){
    return {
      cie_x: r.readUInt32() / 65536.0,
      cie_y: r.readUInt32() / 65536.0,
      cie_z: r.readUInt32() / 65536.0,
    }
  }

  devclass = {
    "scnr": "input devices (scanners and digital cameras)",
    "mntr": "display devices (monitors)",
    "prtr": "output devices (printers)",
    desc: function(r, uint32){
      let a = r.stringOfUInt32(uint32);
      return this[a] || a + " unknown";
    }
  }
  
  colorspace = {
    'link': 'device link profiles',
    'spac': 'color space conversion profiles',
    'abst': 'abstract profiles',
    'nmcl': 'named color profiles',
    desc: function(r, uint32){
      let a = r.stringOfUInt32(uint32);
      return this[a] || a + " unknown";
    }
  }

  pcs = {
    "XYZ ": "XYZData",
    "Lab ": "labData",
    desc: function(r, uint32){
      let a = r.stringOfUInt32(uint32);
      return this[a] || a + " unknown";
    }
  }

  colorSpaceSignatures = {
    "XYZ ": "XYZData",
    "Lab ": "labData",
    "Luv ": "luvData",
    "YCbr": "YCbCrData",
    "Yxy ": "YxyData",
    "RGB ": "rgbData",
    "GRAY": "grayData",
    "HSV ": "hsvData",
    "HLS ": "hlsData",
    "CMYK": "cmykData",
    "CMY ": "cmyData",
    desc: function(r, uint32){
      let a = r.stringOfUInt32(uint32);
      return this[a] || a + " unknown";
    }
  }

  pps = {
    "APPL": "Apple Computer, Inc.",
    "MSFT": "Microsoft Corporation",
    "SIG ": "Silicon Graphics, Inc.",
    "SUNW": "Sun Microsystems, Inc.",
    "TGNT": "Taligent, Inc.",
    desc: function(r, uint32){
      let a = r.stringOfUInt32(uint32);
      return this[a] || a + ": unknown";
    }
  }
}

class MetadataISOBMFF {
  
  // refs;
  // https://developer.apple.com/documentation/quicktime-file-format
  // https://exiftool.org/TagNames/QuickTime.html
  // https://pkg.go.dev/go4.org/media/heif/bmff
  // https://github.com/m-hiki/isobmff/tree/master/isobmff
  // https://www.iso.org/obp/ui/#iso:std:iso-iec:14496:-12:ed-4:v2:cor:1:v1:en
  // https://b.goeswhere.com/ISO_IEC_14496-12_2015.pdf
  // https://www.iso.org/obp/ui/#iso:std:iso-iec:14496:-12:ed-4:v2:cor:1:v1:en


  
  constructor(dataReader){
    this.datareader = dataReader;
    this.metadata = { isobmff: {} };
    dataReader.pushOffset(0);
    this.readBoxes(dataReader, this.metadata.isobmff);
    this.getExif(dataReader);
    dataReader.popOffset();
  }

  BOXSZ_MIN = 2;

  readBoxes(r, root, len=-1){
    let sz = (root.offset + root.size) || r.source.byteLength;
    while(r.offset < sz && len != 0){
      let box = this.readBox(r);
      if (this[box.type] !== undefined)
        this[box.type](r, box);
      let desc = box.type;
      var d = desc;
      var i = 1
      while(root[d] !== undefined)
        d = desc + " " + i++;
      root[d] = box;
      if (box.size < this.BOXSZ_MIN)
        break;
      r.offset = box.offset + box.size;
      len--;
    }
  }

  readBox(r){
    return {
      offset: r.offset,
      size: r.readUInt32(),
      type: r.readString(4)
    }
  }

  fullBox(r, box){
    box.version = r.readUInt8();
    box.flags = r.readUInt24().strHex(6);
  }

  readList(r, box, count, name, callback){
    box[name] = {};
    for (let i = 0 ; i < count; i++){
      box[name] = callback(r, box);
    }
  }

  findKey(obj, match){
    const findKeys = (obj, match) =>
      Object.keys(obj).filter(key => key.match(match));
    let k = findKeys(obj, match);
    if (k.length > 0)
      return obj[k[0]];
  }

  getExif(r){
    let exif = this.findKey(this.metadata.isobmff.meta.iinf.entries, 'Exif');
    if (exif){
      let id = exif.itemId;
      let exts;
      let iloc = this.metadata.isobmff.meta.iloc.entries[id];
      if (iloc && (exts = iloc.extents[0])){
        let exif = {
          offset: exts.offset,
          length: exts.length
        }
        r.pushOffset(exif.offset);
        r.findString('Exif\0\0', false);
        let EXIF = new MetadataEXIF(r, r.offset);
        exif.Exif = EXIF.metadata;
        this.metadata.exif = exif;
        r.popOffset();
      }
    }
  }

  sampleEntry(r, box){
    box.reserveds = r.readUInt8Array(6);
    box.dataReferenceIndex = r.readUInt16();
  }

  visualSampleEntry(r, box){
    box.desc = 'Visual Sample Entry'
    this.sampleEntry(r,box);
    r.addUInt16(box, "pre_defined1", "reserved1");
    box.pre_defined2 = r.readUInt32Array(3);
    r.addUInt16(box, "width", "height");
    r.addUInt32(box, "horizresolution", "vertresolution","reserved2");
    r.addUInt16(box, "frameCount");
    box.compressorName = r.readString(32);
    r.addUInt16(box, "depth", "pre_defined3");
  }

  ftyp(r, root){
    root.desc = 'File Type';  
    root.majorBrand = r.readString(4);
    root.minorVersion = r.readUInt32();
    root.compatibleBrands = [];
    while (r.offset < root.offset + root.size)
      root.compatibleBrands.push(r.readString(4));
  }

  meta(r, root){
    root.desc = 'Metadata';
    this.fullBox(r,root);
    this.readBoxes(r, root);
  }

  hdlr(r, root){
    root.desc = 'Handler Reference'
    this.fullBox(r,root);
    root.predefined = r.readUInt32();
    root.handlerType = r.readString(4);
    root.reserved = r.readUInt32Array(3);
    root.name = r.readString(); 
    r.offset = root.offset + root.size;
  }

  iloc(r, root){
    root.desc = 'Item Location'
    this.fullBox(r, root);
    r.readUParse(1, (byte) => {
      root.offsetSize = byte & 0x0f
      root.lengthSize = (byte >> 4) & 0x0f;
    });
    r.readUParse(1, (byte) => {
      root.baseOffsetSize = byte & 0x0f
      root.indexSize = (byte >> 4) & 0x0f;
    });
    root.itemCount = root.version === 2
      ? r.readUInt32()
      : r.readUInt16();
    root.entries = {};
    for (let i = 0 ; i < root.itemCount; i++){
      let a = this.iloc_e(r, root);
      root.entries[a.itemID] = a;
    }
  }

  iloc_e(r,iloc){
    let a = {
      desc: 'Item Location Entry',
      itemID: iloc.version === 2
        ? r.readUInt32()
        : r.readUInt16(),
      constructionMethod: iloc.version == 1 || iloc.version == 2
        ? r.readUInt16()
        : 0,
      dataReferenceIndex: r.readUInt16(),
      baseOffset: iloc.baseOffsetSize > 0
        ? r.readUInt(iloc.baseOffsetSize)
        : 0,
      extentCount: r.readUInt16()
    }
    if (a.extentCount === 0)
      return a;
    a.extents = [];
    for (let i = 0 ; i < a.extentCount; i++){
      let extent = {
        index: iloc.version == 1 && iloc.indexSize > 0
          ? r.readUInt(iloc.indexSize)
          : "not defined",
        offset: r.readUInt(iloc.offsetSize),
        length: r.readUInt(iloc.lengthSize)
      };
      a.extents.push(extent);
    }
    return a;
  }

  pitm(r, root){
    root.desc = 'Primary Item';
    this.fullBox(r, root);
    root.itemID = r.readUInt16();
  }

  iinf(r, root){
    root.desc = 'Item Information'
    this.fullBox(r,root);
    root.entryInfoCount = r.readUInt16();
    root.entries = {};
    for (let i = 0 ; i < root.entryInfoCount; i++){
      let a = this.infe(r);
      root.entries[a.itemType + " - " + a.itemId] = a;
    }
  }

  infe(r){
    let box = this.readBox(r);
    box.desc = 'Item Information Entry'
    this.fullBox(r,box);
    r.addUInt16(box, "itemId","protectionIndex");
    box.itemType = r.readString();
    return box;
  }

  iprp(r, root){
    root.desc = 'Item Properties';
    this.readBoxes(r, root);
  }

  ipco(r,root){
    root.desc = 'Item Property Container';
    this.readBoxes(r, root);
  }

  iref(r, root){
    root.desc = 'Item Reference'
    this.fullBox(r, root);
    while(r.offset < root.offset + root.size){
      let b = this.readBox(r);
      if (this[b.type])
        this[b.type](r, b);
      b.fromItemID = root.version === 0 ? r.readUInt16() : r.readUInt32();
      b.referenceCount = r.readUInt16();
      if (b.referenceCount > 0){
        b.toItemID = {};
        for (let i = 0 ; i < b.referenceCount ; i++){
          let id = root.version === 0 ? r.readUInt16() : r.readUInt32();
          b.toItemID[i] = id;
        }
      }
      root[b.type] = b;
    }
  }

  dimg(r, root){
    root.desc = 'Derived Image';
  }

  thmb(r, root){
    root.desc = 'Thumbnail';
  }

  auxl(r, root){
    root.desc = 'Auxiliary Image';
  }

  cdsc(r, root){
    root.desc = 'Content describe';
  }

  ispe(r,root){
    this.fullBox(r,root);
    r.addUInt32(root, "width", "height");
    root.desc = "Image Spatial Extents (" + root.width + "x" + root.height + ")";
  }

  pasp(r,root){
    root.desc = 'Pixel Aspect Ratio';
  }

  colr(r,root){
    root.desc = 'Color Information';
  }

  dinf(r,root){
    root.desc = 'Data Information';
  }

  dataReferenceIndex(r,root){
    root.desc = 'Data Reference';
    this.fullBox(r, root);
    root.entryCount = r.readUInt32();
    root.entries = {};
    for (let i = 0 ; i < root.entryCount; i++){
      let b = this.readBox();
      entries[b.type] = b;
    }
  }

  free(r, root){
    root.desc = "Free Space";
    root.data = r.readUInt8Array(root.size);
  }

  //  ISO/IEC 14496-15, ISO/IEC 23008-2
  hvc1(r, root){
    let sz = root.size - (r.offset - root.offset);
    if (sz > 0)
      root.data = r.readUInt8Array(sz);
  }

  //  ISO/IEC 14496-15, ISO/IEC 23008-2
  hvcC(r, root){
    root.desc = 'HEVC Configuration'
    root.hevcConfig = {};
    this.hevcConfigRecord(r, root.hevcConfig);
  }

  hevcConfigRecord(r, root){
    root.configuration_version = r.readUInt8();
    
    r.readUParse(1, (byte) => {
      root.generalProfileSpace = (byte >> 6) & 0b11;
      root.generalTierFlag = (byte >> 5) & 0b1;
      root.generalProfileIdc = byte & 0b11111;
    });

    root.generalProfileCompatFlags = r.readUInt32().strHex(4);
    root.generalConstIndicatorFlags = ((r.readUInt32() << 16) | (r.readUInt16())).strHex(6);
    root.generalLevelIdc = r.readUInt8();

    r.readUParse(1, (byte) => {
      root.reserved1 = (byte >> 4) & 0b1111;
      let msbyte = (byte & 0b1111) << 8;
      let lsbyte = r.readUInt8(); 
      root.minSpatialSegmentationIdc = (msbyte << 8) | lsbyte;  
    });
    
    r.readUParse(1, (byte) => {
      root.reserved2 = (byte >> 2) & 0b111111;
      root.parallelismType = byte & 0b11;
    });
    
    r.readUParse(1, (byte) => {
      root.reserved3 = (byte >> 2) & 0b111111;
      root.chromaFormat = byte & 0b11;
    });
    
    r.readUParse(1, (byte) => {
      root.reserved4 = (byte >> 3) & 0b11111;
      root.bitDepthLumaMinus8 = byte & 0b111;
    });

    r.readUParse(1, (byte) => {
      root.reserved5 = (byte >> 3) & 0b11111;
      root.bitDepthChromaMinus8 = byte & 0b111;
    });
    
    root.avgFrameRate = r.readUInt16();
    
    r.readUParse(1, (byte) => {
      root.constantFrameRate = (byte >> 6) & 0b11;    
      root.numTemporalLayers = (byte >> 3) & 0b11;
      root.temporalIdNested = (byte >> 2) & 0b1;
      root.lengthSizeMinus1 = byte & 0b11;
    });
    
    root.numOfArrays = r.readUInt8();
    root.array = [];
    for (let i = 0 ; i < root.numOfArrays; i++){
      root.array.push(this.hevcConfigRecordItem(r));
    }
  }

  hevcConfigRecordItem(r){
    let item = {}
    r.readUParse(1,(byte) =>{
      item.arrayCompleteness = (byte >> 7) & 0b1;
      item.nalUnitType = byte & 0b111111;
    });
    item.numNalus = r.readUInt16();
    item.nalUnits = [];
    for (let i = 0 ; i < item.numNalus; i++){
      let unit = {
        nalUnitLen: r.readUInt16(),
      }
      unit.nalUnit = r.readUInt8Array(unit.nalUnitLen);
      item.nalUnits.push(unit);
    }
    return item
  }

  pixi(r,root){
    root.desc = 'Pixel Information';
  }

  rloc(r,root){
    root.desc = 'Relative Information';
  }

  ipma(r,root){
    root.desc = 'Item Property Association'
    root.entryCount = r.readUInt32();
    if (root.entryCount === 0)
      return;
    root.items = [];
    for (let i = 0 ; i < root.entryCount; i++){
      let item = {
        id: root.version < 1
          ? r.readUInt16()
          : r.readUInt32(),
          associationCount: r.readUInt8(),
          associations: []
      }
      for (let j = 0 ; j < item.associationCount; j++){
        let b;
        if (root.flags & 0b1){
          b = r.readUInt16();
          item.associations.push({
            essential: (b >> 15) & 0b1,
            propertyIndex: byte & 0b111111111111111
          });
        } else {
          b = r.readUInt8();
          item.associations.push({
            essential: (b >> 7) & 0b1,
            propertyIndex: byte & 0b1111111
          });
        }
      }
      root.items.push(item);
    }
  }

  mdat(r, root){
    root.desc = "Media Data";
    root.data = r.readUInt8Array(8);
  }

  mhdr(r, root){
    this.fullBox(r, root);
    root.nextItemID = r.readUInt32();
  }

  keys(r, root){
    this.fullBox(r, root);
    root.entryCount = r.readUInt32();
    root.keys = {};
    for (let i = 0 ; i < root.entryCount; i++){
      let key = {
        keySize: r.readUInt32(),
        keyNamespace: r.readString(4),
      }
      key.name = r.readString(key.keySize);
      root.keys[key.name] = key;
    }sampleCount
  }

  moov(r, root){
    this.readBoxes(r, root);
  }

  mvhd(r, root){
    this.fullBox(r, root);
    r.addUInt32(root, "creationTime", "modificationTime", "timeScale", "duration", "preferredRate");
    r.addUInt16(root, "preferredVolume");
    root.matrixStructure = r.readUInt32Array(9);
    r.addUInt32(root, "previewTime", "previewDuration", "posterTime", "selectionTime", "selectionDuration", "currentTime", "nextTrackID");
  }


  stbl(r, root){
    root.desc = 'Sample Table'
  }

  stsd(r, root){
    root.desc = 'Sample Description'
    this.fullBox(r, root);
    root.entryCount = r.readUInt32();
    this.readBoxes(r, root, root.entryCount);
  }

  stco(r, root){
    root.desc = 'Chunk Offset'
    this.fullBox(r, root);
    root.entryCount = r.readUInt32();
    root.entries = [];
    for (let i = 0 ; i < root.entryCount; i++){
      root.entries.push({
        chunkOffset: r.readUInt32(),
      })
    }
  }
  
  stsc(r, root){
    root.desc = 'Sample To Chunk'
    this.fullBox(r, root);
    root.entryCount = r.readUInt32();
    root.entries = [];
    for (let i = 0 ; i < root.sampleCount; i++){
      root.entries.push({
        firstChunk: r.readUInt32(),
        samplesPerChunk: r.readUInt32(),
        sampleDescriptionIndex: r.readUInt32()
      })
    }
  }

  stss(r, root){
    root.desc = 'Sync Sample'
    this.fullBox(r, root);
    root.entryCount = r.readUInt32();
    if (root.sampleSize === 0){
      root.entries = [];
      for (let i = 0 ; i < root.sampleCount; i++){
        root.entries.push({
          sampleNumber: r.readUInt32()
        })
      }
    }
  }

  stsz(r, root){
    root.desc = 'Sample Size'
    this.fullBox(r, root);
    root.sampleSize = r.readUInt32();
    root.sampleCount = r.readUInt32();
    if (root.sampleSize === 0){
      root.entries = [];
      for (let i = 0 ; i < root.sampleCount; i++){
        root.entries.push({
          entrySize: r.readUInt32(),
          sampleDelta: r.readUInt32()
        })
      }
    }
  }

  stts(r, root){
    root.desc = 'Time To Sample'
    this.fullBox(r, root);
    root.entryCount = r.readUInt32();
    root.entries = [];
    for (let i = 0 ; i < root.entryCount; i++){
      root.entries.push({
        sampleCount: r.readUInt32(),
        sampleDelta: r.readUInt32()
      })
    }
  }

  trak(r, root){
    root.desc = 'Track'
  }

  tkhd(r, root){
    root.desc = 'Track Header';
    this.fullBox(r, root);
    if (root.version === 1){
      r.addUInt64(root, "creationTime", "modificationTime");
      r.addUInt32(root, "trackId","reserved1");
      r.addUInt64(root, "duration");
    } else {
      r.addUInt32(root, "creationTime", "modificationTime","trackId","reserved1","duration");
    }
    root.reserved2 = r.readUInt32Array(2);
    r.addUInt16(root, "layer", "alternateGroup","volume","reserved3");
    root.matrix = r.readUInt32Array(9);
    r.addUInt16(root, "width", "height");
  }

}

class MetadataPNG {

  // ref: https://www.w3.org/TR/png/#5Chunk-layout


  static checkSignature(dataReader){
    return dataReader.getUInt32(0,false) === 0x89504e47
      && dataReader.getUInt32(4, false) === 0x0d0a1a0a;
  }

  constructor(dataReader, displayHtml=false){
    this.datareader = dataReader;
    let oldLE = dataReader.le;
    this.colorType = 0;
    this.displayHtml = displayHtml;
    dataReader.le =false;
    this.metadata = { png: {} };
    dataReader.pushOffset(0);
    this.load(dataReader, this.metadata.png);
    dataReader.popOffset();
    dataReader.le = oldLE;
  }

  load(r, root){
    root.signature = r.readUInt32Array(2);
    let ch;
    while((ch = this.readChunk(r))){
      if (this[ch.type]){
        r.pushOffset(ch.dataOffset);
        this[ch.type](r, ch);
        r.popOffset();
      }
      root[ch.type] = ch;
      if (ch.type === 'IEND')
        break;
    }
  }

  readChunk(r){
    let ch = {
      offset: r.offset,
      length: r.readUInt32(),
      type: r.readString(4),
      dataOffset: r.offset
    }
    if (ch.length < r.source.byteLength){
      r.skip(ch.length);
      ch.crc = r.readUInt32().strHex(4);
      if (/[A-Za-z]/g.test(ch.type))
        return ch;
    } else {
      console.log("fail to read chunk " + JSON.stringify(ch, null, 2));
    }
  }

  colorType = {
    "0": "Greyscale", // 	1, 2, 4, 8, 16 	Each pixel is a greyscale sample
    "2": "Truecolor", // 	8, 16 	Each pixel is an R,G,B triple
    "3": "Indexed-color", // 	1, 2, 4, 8 	Each pixel is a palette index; a PLTE chunk shall appear.
    "4": "Greyscale with alpha", //	8, 16 	Each pixel is a greyscale sample followed by an alpha sample.
    "6": "Truecolor with alpha", //	8, 16 	Each pixel is an R,G,B triple followed by an alpha sample.
  }

  IHDR(r, root){
    root.desc = "Image header";
    r.addUInt32(root, "width", "height");
    r.addUInt8(root, "bitDepth", "colorType", "compressionMethod", "filterMethod", "interlaceMethod");
    this.colorType = root.colorType;
  }

  pHYs(r, root){
    root.desc = "Physical pixel";
    r.addUInt32(root, "pixelsPerUnitX", "pixelsPerUnitY");
    r.addUInt8(root, "unit");
  }

  PLTE(r, root){
    root.desc = "Palette";
    root.palette = [];
    let end = root.dataOffset + root.length;
    var c;
    let b0 = "<span style='width:10px; height:10px; display:inline-block; margin-right: 8px; background-color: ";
    let b1 = "'></span>"
    while(r.offset < end){
      c = "#" + r.readUInt24().toString(16).padStart(6,'0');
      root.palette.push(this.displayHtml ? b0 + c + b1 + c : c);
    }
  }

  IDAT(r, root){
    root.desc = "Image data";
    root.type += " @"+root.offset;
  }

  IEND(r, root){
    root.desc = 'Image trailer';
  }

  acTL(r, root){
    root.desc = "Header";
    r.addUInt32(root, "num_frames", "num_plays");
  }

  cHRM(r, root){
    root.desc = "Primary chromaticities and white point";
    r.addUInt32(root, "whitePointX", "whitePointY","redX","redY","greenX","greenY","blueX","blueY");
  }

  gAMA(r, root){
    root.desc = "Image gamma";
    root.imageGamma = r,readUInt32()/100000.0;
  }

  iCCP(r, root){
    root.desc = "Embedded ICC profile";
    root.profileName = r.readString();
    root.compressionMethod = r.readUInt8();
  }

  sBIT(r, root){
    root.desc = "Significant Bits";
    if (this.colorType & 2)
      r.addUInt8(root, "sBitsRed","sBitsGreen","sBitsBlue"); // colorType 2,3,6
    else
      r.addUInt8(root, "sBitsGreyscale"); // colorType 0, 4
    if (this.colorType & 4)
      root.sBitsAlpha = r.readUInt8();
  }

  tRNS(r, root){
  }
  
}