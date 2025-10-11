const KBLH = {
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
  }
}