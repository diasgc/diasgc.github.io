function _strMatchWords(str, words){
  for (let i = 0 ; i < words.length; i++){
    if (str.indexOf(words[i]) != -1){
      return true;
    }
  }
  return false;
}

function _newElement(tag, classname, content){
  const e = document.createElement(tag);
  if (classname)
    e.className = classname;
  if (content)
    e.innerHTML = content;
  return e;
}

function _newScript(src,async=true){
  let js = document.createElement('script');
  js.src = src;
  js.type = "text/javascript";
  js.async = async;
  return js;
}

function _hexStr(n, pad, prefix){
  n = n || 0;
  prefix = prefix || "";
  if (typeof n === "bigint" || (n).constructor === BigInt)
    return prefix + n.toString(16).padStart(8,'0');
  pad = pad || Math.floor(Math.log(n * n)/(8 * Math.LN2)) + 2;
  return prefix + n.toString(16).padStart(pad,'0');
}

function _binStr(n, pad, prefix){
  pad = pad || Math.floor(Math.log(n * n)/(8 * Math.LN2)) + 2;
  prefix = prefix || "";
  return prefix + n.toString(2).padStart(pad,'0');
}

function _asciiStr(char, nonReadableChar){
  nonReadableChar = nonReadableChar || '.';
  return char < 33 || char > 126 ? nonReadableChar : String.fromCharCode(char);
}

const _dateIntlFormat = new Intl.DateTimeFormat(navigator.language, {
  year: "numeric",
  month: "long",
  day: "numeric"
});

function _filenameFromPath(path, sep='/'){
  let i = path.lastIndexOf(sep);
  return path.substring(i + 1);
}

function _fileExtension(path){
  let i = path.lastIndexOf('.');
  return path.substring(i + 1);
}

const rtf = new Intl.RelativeTimeFormat(navigator.language, { numeric: "auto" });

function _fmtTime(timestamp, showHex=true){
  let diff = new Date().getTime() - timestamp;
  if (diff < 2592000000){ /* 30 days */
    if (diff < 604800000){ /* 1 week */
      if (diff < 86400000){ /* 1 day */
        if (diff < 3600000){ /* 1 hour */
          if (diff < 60000){ /* 1 minute */
            return rtf.format(-Math.round(diff/1000),"second");
          } else {
            return rtf.format(-Math.round(diff/60000),"minute");
          }
        } else {
          return rtf.format(-Math.round(diff/3600000),"hour");
        }
      } else {
        return rtf.format(-Math.round(diff/86400000),"day");
      }
    } else {
      return rtf.format(-Math.round(diff/604800000),"week");
    }
  } else if (timestamp < 946728000000 && showHex){
    return "0x" + timestamp.toString(16).padStart(8,'0');
  }
  return _dateIntlFormat.format(timestamp);

}

function _pathSplitLastSegment(path){
  let i = path.lastIndexOf('/') ;
  return {
    parent: path.substring(0, i++),
    name: path.substring(i)
  }
}

const _siUnits = ['k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

function _fmtBytes(bytes){
  return _fmtSize(bytes, 1024, 1) + 'B';
}

function _fmtBytesSI(bytes){
  return _fmtSize(bytes, 1000, 1) + 'iB';
}

function _fmtSize(val, thresh, dp=1) {

  if (Math.abs(val) < thresh)
    return val;

  let u = -1;
  const r = 10**dp;

  do {
    val /= thresh;
    ++u;
  } while (Math.round(Math.abs(val) * r) / r >= thresh && u < _siUnits.length - 1);


  return val.toFixed(dp) + ' ' + _siUnits[u];
}