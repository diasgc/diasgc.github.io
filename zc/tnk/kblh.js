const KBLH = {
  // https://www.unicode.org/charts/PDF/U0590.pdf
  m_hechr: [1,2,3,4,5,6,7,8,9,10,20,20,30,40,40,50,50,60,70,80,80,90,90,100,200,300,400],
  m_gadol: [1,2,3,4,5,6,7,8,9,10,500,20,30,600,40,700,50,60,70,800,80,900,90,100,200,300,400],
  m_sidur: [1,2,3,4,5,6,7,8,9,10,11,11,12,13,13,14,14,15,16,17,17,18,18,19,20,21,22],
  m_katan: [1,2,3,4,5,6,7,8,9,1,2,2,3,4,4,5,5,6,7,8,8,9,9,1,2,3,4],
  mispar: {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50,
    'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100,
    'ר': 200, 'ש': 300, 'ת': 400
  },
  misparGadol: {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ך': 500, 'ל': 30, 'מ': 40, 'ם': 600, 'נ': 50, 'ן': 700,
    'ס': 60, 'ע': 70, 'פ': 80, 'ף': 800, 'צ': 90, 'ץ': 900, 'ק': 100,
    'ר': 200, 'ש': 300, 'ת': 400
  },
  misparSiduri: {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 11, 'ך': 11, 'ל': 12, 'מ': 13, 'ם': 13, 'נ': 14, 'ן': 14,
    'ס': 15, 'ע': 16, 'פ': 17, 'ף': 17, 'צ': 18, 'ץ': 18, 'ק': 19,
    'ר': 20, 'ש': 21, 'ת': 22
  },
  misparKatan: {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 1, 'כ': 2, 'ך': 2, 'ל': 3, 'מ': 4, 'ם': 4, 'נ': 5, 'ן': 5,
    'ס': 6, 'ע': 7, 'פ': 8, 'ף': 8, 'צ': 9, 'ץ': 9, 'ק': 1,
    'ר': 2, 'ש': 3, 'ת': 4
  },
  sofit: {
    'ך': 'כ',
    'ם': 'מ',
    'ן': 'נ',
    'ף': 'פ',
    'ץ': 'צ'
  },
  removeSep: function(s){
    return s.replace(/[׀־]/g,' ');
  },
  strip: function(input, keepNikud=true, keepTaamim=true){
    const i0 = keepTaamim ? 
      input.match(/[\u0590-\u05FF]+/g) : 
      keepNikud ? input.match(/[\u05B0-\u05FF]+/g) :
      input.match(/[\u05D0-\u05FF]+/g);
    return i0[0] || '';
  },
  removeTaamim: function(s){
    let out = '';
    for (let i = 0; i < s.length; i++){
      let c = s.charCodeAt(i);
      out += c > 0x0590 && c < 0x05b0 ? '' : String.fromCharCode(c);
    }
    return out;
  },
  removeNikud: function(s){
    let out = '';
    s = this.removeSep(s);
    for (let i = 0; i < s.length; i++){
      let c = s.charCodeAt(i);
      out += c !== 0x05c6 && c > 0x0590 && c < 0x05c8 ? '' : String.fromCharCode(c);
    }
    return out;
  },
  removeSofit: function(c){
    return this.sofit[c] || c;
  },
  getMilim: function(s){
    s = this.removeSep(s);
    s = this.removeNikud(s).replace(/\s+/g,' ').trim();
    return s.length === 0 ? [] : s.split(' ');
  },
  countMilim: function(s){
    return this.removeSep(s).length;
  },
  getOtiot: function(s){
    let out = '';
    for (let i=0; i < s.length; i++){
      let c = s.charCodeAt(i);
      out += c > 0x05cf && c < 0x05eb ? String.fromCharCode(c) : '';
    }
    return out;
  },
  countOtiot: function(s){
    return this.getOtiot(s).length;
  },
  htmlSpanWords: function(s, callbackName){
    const span = `<span onclick='${callbackName}(this,event)'>`;
    let out = span;
    for (let i=0; i < s.length; i++){
      let c = s.charAt(i);
      if (c === '׃') // break at the end of perek
        return `${out}</span>${s.substring(i)}`;
      if (c === ' ' || c === '׀' || c === '־'){
        out += `</span>${c}`;
        if (i < s.length - 2)
          out += span;
      } else {
        out += c;
      }
    }
    return out; // probably not reached
  },
  getGematria: function(s, gemMap='mispar'){
    let out = 0;
    const map = this[gemMap] || this.mispar;
    for (let i=0; i < s.length; i++){
      out += map[s[i]] || 0;
    }
    return out;
  },
  getGematria2: function(s, gemMap='m_hechr'){
    let out = 0;
    const map = this[gemMap] || this.m_hechr;
    for (let i=0; i < s.length; i++){
      out += map[s.charCodeAt(i) - 0x05D0] || 0;
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
  },
}