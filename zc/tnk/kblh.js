const KBLH = {
  gematriaMap: {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
    'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100,
    'ר': 200, 'ש': 300, 'ת': 400
  },
  gematriaMapSof: {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
    'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100,
    'ר': 200, 'ש': 300, 'ת': 400
  },
  heFormatOtiot: function(s){
   let out = '';
   for (let i=0; i < s.length; i++){
    let c = s.charCodeAt(i);  
    if ((c > 0x05cf && c < 0x05eb || c === 0x20))
      out += String.fromCharCode(c);
    }
    return out;
  },
  heFormatNikud: function(s){
    let out = '';
    for (let i=0; i < s.length; i++){
      let c = s.charCodeAt(i);  
      if (c === 0x20 || (c > 0x05af && c < 0x05eb && c != 0x05bd && c != 0x05c0)) {
        out += String.fromCharCode(c);
      }
    }
    return out;
  },
  removeSep: function(s){
    return s.replaceAll('־'," ");
  },
  removeTaamim: function(s){
    s = s.replaceAll('־'," ");
    let out = '';
    for (let i=0; i < s.length; i++){
      let c = s.charCodeAt(i);
      out += c > 0x0590 && c < 0x05b0 ? '' : String.fromCharCode(c);
    }
    return out;
  },
  removeNikud: function(s){
    let out = '';
    s = s.replaceAll('־'," ");
    for (let i=0; i < s.length; i++){
      let c = s.charCodeAt(i);
      out += c !== 0x05c6 && c > 0x0590 && c < 0x05c8 ? '' : String.fromCharCode(c);
    }
    return out;
  },
  getOtiot: function(s){
    return this.heFormatOtiot(s).replace(/\s+/g,'');
  },
  getGematria: function(s, useSofit=false){
    let out = 0;
    const map = useSofit ? this.gematriaMapSof : this.gematriaMap;
    for (let i=0; i < s.length; i++){
      out += map[s[i]] || 0;
    }
    return out;
  },
  getMatrixDimArray: function(minDim, seq){
    let out = [];
    let str = '';
    let c = seq.length;
    for (let i = minDim; i <= Math.ceil(Math.sqrt(c)); i++){
      if (c % i === 0){
        out.push([i, c/i]);
        str += `${i}x${c/i} `;
      }
    }
    return {"array": out, "str": str.trim()};
  }
}