const k_elf = {
  strHexTagDsc: function(bits, v, t, dsc){
    bits /= 8;
    return "0x" + v.toString(16).padStart(bits,'0') + " " + t + ": " + dsc;
  },
  strHex: function(v){
    let pad = Math.floor(Math.log(v)/Math.log(256) + 1) * 2;
    return "0x" + v.toString(16).padStart(pad, '0');
  },
  strUint8array: function(arr){
    var str = "";
    arr.forEach((b) => str += "0x" + b.toString(16).padStart(2,'0'))+ " ";
    return str.trim();
  },
  str: function(tbl, bits, v){
    console.log("reading "+JSON.stringify(tbl));
    let e = this.get(tbl, v);
    return this.strHexTagDsc(bits, v, e.tag, e.dsc);
  },
  get: function(tbl, v){
    return tbl[v.toString()] ? tbl[v.toString()] : tbl["0"];
  },
  flags: function(tbl, bits, v){
    if (v === 0)
      return 0;
    let o = {}
    var f = 1;
    var ft;
    for (let i = 1 ; i < bits; i++){
      if ((v & f) == f){
        ft = tbl[f.toString()];
        if (ft)
          o[ft.tag] = ft.dsc;
      }
      f *= 2;
    }
    return o;
  },
  EI_CLASS: {
    "0":   {tag: "ELFCLASSNONE", dsc: "invalid class"},
    "1":   {tag: "ELFCLASS32",   dsc: "32-bit architecture"},
    "2":   {tag: "ELFCLASS64",   dsc: "64-bit architecture"},
  },
  EI_DATA: {
    "0":   {tag: "ELFDATANONE",        dsc: "Invalid data encoding"},
    "1":   {tag: "ELFDATA2LSB",        dsc: "Two's complement, little-endian"},
    "2":   {tag: "ELFDATA2MSB",        dsc: "Two's complement, big-endian"},
  },
  EI_VERSION: {
    "0": {tag: "EV_NONE",    dsc: "invalid version"},
    "1": {tag: "EV_CURRENT", dsc: "Current version"}
  },
  EI_OSABI: {
    "0":  {tag: "ELFOSABI_NONE",        dsc: "unspecified"},
    "1":  {tag: "ELFOSABI_HPUX",        dsc: "HP-UX ABI"},
    "2":  {tag: "ELFOSABI_NETBSD",      dsc: "NetBSD ABI"},
    "3":  {tag: "ELFOSABI_LINUX",       dsc: "Linux ABI"},
    "6":  {tag: "ELFOSABI_SOLARIS",     dsc: "Solaris ABI"},
    "7":  {tag: "ELFOSABI_AIX",         dsc: "AIX ABI"},
    "8":  {tag: "ELFOSABI_IRIX",        dsc: "IRIX ABI"},
    "9":  {tag: "ELFOSABI_FREEBSD",     dsc: "FreeBSD ABI"},
    "10": {tag: "ELFOSABI_TRU64",       dsc: "Compaq TRU64 UNIX ABI"},
    "11": {tag: "ELFOSABI_MODESTO",     dsc: "Novell Modesto"},
    "12": {tag: "ELFOSABI_OPENBSD",     dsc: "Open BSD"},
    "13": {tag: "ELFOSABI_OPENVMS",     dsc: "Open VMS"},
    "14": {tag: "ELFOSABI_NSK",         dsc: "Hewlett-Packard Non-Stop Kernel"},
    "15": {tag: "ELFOSABI_AROS",        dsc: "Aros"},
    "16": {tag: "ELFOSABI_FENIXOS",     dsc: "FenixOS"},
    "17": {tag: "ELFOSABI_NUXI",        dsc: "Nuxi CloudABI"},
    "18": {tag: "ELFOSABI_OPENVOS",     dsc: "Stratus Technologies OpenVOS"},
    "64": {tag: "ELFOSABI_ARM_AEABI",   dsc: "ARM architecture EABI"},
    "97": {tag: "ELFOSABI_ARM",         dsc: "ARM architecture ABI"},
    "255": {tag: "ELFOSABI_STANDALONE", dsc: "Stand-alone (embedded) ABI"},
  },
  e_type: {
    "0": {tag: "ET_NONE", dsc: "No file type"},
    "1": {tag: "ET_REL", dsc: "Relocatable file"},
    "2": {tag: "ET_EXEC", dsc: "Executable file"},
    "3": {tag: "ET_DYN", dsc: "Shared object file"},
    "4": {tag: "ET_CORE", dsc: "Core file"},
    "65024": {tag: "ET_LOOS", dsc: "Operating system-specific"}, // 0xfe00
    "65279": {tag: "ET_HIOS", dsc: "Operating system-specific"}, // 0xfeff
    "65280": {tag: "ET_LOPROC", dsc: "Processor-specific"}, // 0xff00
    "65535": {tag: "ET_HIPROC", dsc: "Processor-specific"}, // 0xffff
  },
  e_machine: {
    '0':  { tag: 'EM_NONE', dsc: "No machine" },
    '1':  { tag: 'EM_M32', dsc: "AT&T WE 32100" },
    '2':  { tag: 'EM_SPARC', dsc: "SPARC" },
    '3':  { tag: 'EM_386', dsc: "Intel 80386" },
    '4':  { tag: 'EM_68K', dsc: "Motorola 68000" },
    '5':  { tag: 'EM_88K', dsc: "Motorola 88000" },
    '6':  { tag: 'EM_486', dsc: "Intel 80486" },
    '7':  { tag: 'EM_860', dsc: "Intel 80860" },
    '8':  { tag: 'EM_MIPS', dsc: "MIPS I Architecture" },
    '9':  { tag: 'EM_S370', dsc: "IBM System/370 Processor" },
    '10': { tag: 'EM_MIPS_RS3_LE', dsc: "MIPS RS3000 Little-endian" },
    '15': { tag: 'EM_PARISC', dsc: "Hewlett-Packard PA-RISC" },
    '17': { tag: 'EM_VPP500', dsc: "Fujitsu VPP500" },
    '18': { tag: 'EM_SPARC32PLUS', dsc: "Enhanced instruction set SPARC" },
    '19': { tag: 'EM_960', dsc: "Intel 80960" },
    '20': { tag: 'EM_PPC', dsc: "PowerPC" },
    '21': { tag: 'EM_PPC64', dsc: "64-bit PowerPC" },
    '22': { tag: 'EM_S390', dsc: "IBM System/390 Processor" },
    '36': { tag: 'EM_V800', dsc: "NEC V800" },
    '37': { tag: 'EM_FR20', dsc: "Fujitsu FR20" },
    '38': { tag: 'EM_RH32', dsc: "TRW RH-32" },
    '39': { tag: 'EM_RCE', dsc: "Motorola RCE" },
    '40': { tag: 'EM_ARM', dsc: "Advanced RISC Machines ARM" },
    '41': { tag: 'EM_ALPHA', dsc: "Digital Alpha" },
    '42': { tag: 'EM_SH', dsc: "Hitachi SH" },
    '43': { tag: 'EM_SPARCV9', dsc: "SPARC Version 9" },
    '44': { tag: 'EM_TRICORE', dsc: "Siemens TriCore embedded processor" },
    '45': { tag: 'EM_ARC', dsc: "Argonaut RISC Core (Argonaut Technologies Inc.)" },
    '46': { tag: 'EM_H8_300', dsc: "Hitachi H8/300" },
    '47': { tag: 'EM_H8_300H', dsc: "Hitachi H8/300H" },
    '48': { tag: 'EM_H8S', dsc: "Hitachi H8S" },
    '49': { tag: 'EM_H8_500', dsc: "Hitachi H8/500" },
    '50': { tag: 'EM_IA_64', dsc: "Intel IA-64 processor architecture" },
    '51': { tag: 'EM_MIPS_X', dsc: "Stanford MIPS-X" },
    '52': { tag: 'EM_COLDFIRE', dsc: "Motorola ColdFire" },
    '53': { tag: 'EM_68HC12', dsc: "Motorola M68HC12" },
    '54': { tag: 'EM_MMA', dsc: "Fujitsu MMA Multimedia Accelerator" },
    '55': { tag: 'EM_PCP', dsc: "Siemens PCP" },
    '56': { tag: 'EM_NCPU', dsc: "Sony nCPU embedded RISC processor" },
    '57': { tag: 'EM_NDR1', dsc: "Denso NDR1 microprocessor" },
    '58': { tag: 'EM_STARCORE', dsc: "Motorola Star*Core processor" },
    '59': { tag: 'EM_ME16', dsc: "Toyota ME16 processor" },
    '60': { tag: 'EM_ST100', dsc: "STMicroelectronics ST100 processor" },
    '61': { tag: 'EM_TINYJ', dsc: "Advanced Logic Corp. TinyJ embedded processor family" },
    '62': { tag: 'EM_X86_64', dsc: "AMD x86-64 architecture" },
    '63': { tag: 'EM_PDSP', dsc: "Sony DSP Processor" },
    '64': { tag: 'EM_PDP10', dsc: "Digital Equipment Corp. PDP-10" },
    '65': { tag: 'EM_PDP11', dsc: "Digital Equipment Corp. PDP-11" },
    '66': { tag: 'EM_FX66', dsc: "Siemens FX66 microcontroller" },
    '67': { tag: 'EM_ST9PLUS', dsc: "STMicroelectronics ST9+ 8/16 bit microcontroller" },
    '68': { tag: 'EM_ST7', dsc: "STMicroelectronics ST7 8-bit microcontroller" },
    '69': { tag: 'EM_68HC16', dsc: "Motorola MC68HC16 Microcontroller" },
    '70': { tag: 'EM_68HC11', dsc: "Motorola MC68HC11 Microcontroller" },
    '71': { tag: 'EM_68HC08', dsc: "Motorola MC68HC08 Microcontroller" },
    '72': { tag: 'EM_68HC05', dsc: "Motorola MC68HC05 Microcontroller" },
    '73': { tag: 'EM_SVX', dsc: "Silicon Graphics SVx" },
    '74': { tag: 'EM_ST19', dsc: "STMicroelectronics ST19 8-bit microcontroller" },
    '75': { tag: 'EM_VAX', dsc: "Digital VAX" },
    '76': { tag: 'EM_CRIS', dsc: "Axis Communications 32-bit embedded processor" },
    '77': { tag: 'EM_JAVELIN', dsc: "Infineon Technologies 32-bit embedded processor" },
    '78': { tag: 'EM_FIREPATH', dsc: "Element 14 64-bit DSP Processor" },
    '79': { tag: 'EM_ZSP', dsc: "LSI Logic 16-bit DSP Processor" },
    '80': { tag: 'EM_MMIX', dsc: "Donald Knuth's educational 64-bit processor" },
    '81': { tag: 'EM_HUANY', dsc: "Harvard University machine-independent object files" },
    '82': { tag: 'EM_PRISM', dsc: "SiTera Prism" },
    '83': { tag: 'EM_AVR', dsc: "Atmel AVR 8-bit microcontroller" },
    '84': { tag: 'EM_FR30', dsc: "Fujitsu FR30" },
    '85': { tag: 'EM_D10V', dsc: "Mitsubishi D10V" },
    '86': { tag: 'EM_D30V', dsc: "Mitsubishi D30V" },
    '87': { tag: 'EM_V850', dsc: "NEC v850" },
    '88': { tag: 'EM_M32R', dsc: "Mitsubishi M32R" },
    '89': { tag: 'EM_MN10300', dsc: "Matsushita MN10300" },
    '90': { tag: 'EM_MN10200', dsc: "Matsushita MN10200" },
    '91': { tag: 'EM_PJ', dsc: "picoJava" },
    '92': { tag: 'EM_OPENRISC', dsc: "OpenRISC 32-bit embedded processor" },
    '93': { tag: 'EM_ARC_A5', dsc: "ARC Cores Tangent-A5" },
    '94': { tag: 'EM_XTENSA', dsc: "Tensilica Xtensa Architecture" },
    '95': { tag: 'EM_VIDEOCORE', dsc: "Alphamosaic VideoCore processor" },
    '96': { tag: 'EM_TMM_GPP', dsc: "Thompson Multimedia General Purpose Processor" },
    '97': { tag: 'EM_NS32K', dsc: "National Semiconductor 32000 series" },
    '98': { tag: 'EM_TPC', dsc: "Tenor Network TPC processor" },
    '99': { tag: 'EM_SNP1K', dsc: "Trebia SNP 1000 processor" },
    '100': { tag: 'EM_ST200', dsc: "STMicroelectronics (www.st.com) ST200 microcontroller" },
    '183': { tag: 'EM_AARCH64', dsc: "ARM 64-bit architecture (AARCH64)" },
    '190': { tag: 'EM_CUDA', dsc: "NVIDIA CUDA architecture" },
    '224': { tag: 'EM_AMDGPU', dsc: "AMD GPU architecture" },
  },
  p_type: {
    "0": {tag: "PT_NULL",    dsc: "null"},
    "1": {tag: "PT_LOAD",    dsc: "load"},
    "2": {tag: "PT_DYNAMIC", dsc: "dynamic"},
    "3": {tag: "PT_INTERP",  dsc: "interp"},
    "4": {tag: "PT_NOTE",    dsc: "note"},
    "5": {tag: "PT_SHLIB",   dsc: "shlib"},
    "6": {tag: "PT_PHDR",    dsc: "phdr"},
    "7": {tag: "PT_TLS",     dsc: "tls"},
    "1610612736": {tag: "PT_LOOS",    dsc: "(lo_os)"},   // 0x60000000
    "1879048191": {tag: "PT_HIOS",    dsc: "(hi_os)"},   // 0x6fffffff
    "1879048192": {tag: "PT_LOPROC",  dsc: "(lo_proc)"}, // 0x70000000
    "2147483647": {tag: "PT_HIPROC",  dsc: "(hi_proc)"}, // 0x7fffffff
  },
  p_flags: {
    "1": {tag: "PF_X", dsc: "Executable segment"},
    "2": {tag: "PF_W", dsc: "Writeable segment"},
    "4": {tag: "PF_R", dsc: "Readable segment"}
  },
  sh_type: {
    '0': {tag: 'SHT_NULL ', dsc: 'Section header table entry unused'},
    '1': {tag: 'SHT_PROGBITS ', dsc: 'Program data'},
    '2': {tag: 'SHT_SYMTAB ', dsc: 'Symbol table'},
    '3': {tag: 'SHT_STRTAB ', dsc: 'String table'},
    '4': {tag: 'SHT_RELA ', dsc: 'Relocation entries with addends'},
    '5': {tag: 'SHT_HASH ', dsc: 'Symbol hash table'},
    '6': {tag: 'SHT_DYNAMIC ', dsc: 'Dynamic linking information'},
    '7': {tag: 'SHT_NOTE ', dsc: 'Notes'},
    '8': {tag: 'SHT_NOBITS ', dsc: 'Program space with no data (bss)'},
    '9': {tag: 'SHT_REL ', dsc: 'Relocation entries, no addends'},
    '10': {tag: 'SHT_SHLIB ', dsc: 'Reserved'},
    '11': {tag: 'SHT_DYNSYM ', dsc: 'Dynamic linker symbol table'},
    '14': {tag: 'SHT_INIT_ARRAY ', dsc: 'Array of constructors'},
    '15': {tag: 'SHT_FINI_ARRAY ', dsc: 'Array of destructors'},
    '16': {tag: 'SHT_PREINIT_ARRAY ', dsc: 'Array of pre-constructors'},
    '17': {tag: 'SHT_GROUP ', dsc: 'Section group'},
    '18': {tag: 'SHT_SYMTAB_SHNDX ', dsc: 'Extended section indices'},
    '19': {tag: 'SHT_NUM ', dsc: 'Number of defined types.'},
    '1610612736': {tag: 'SHT_LOOS ', dsc: 'Start OS-specific. '},
    '1879048191': {tag: 'SHT_HIOS', dsc: 'Start OS-specific. '},
    '1879048192': {tag: 'SHT_LOPROC', dsc: 'Start Processor-specific. '},
    '2147483647': {tag: 'SHT_HIPROC', dsc: 'Start Processor-specific. '},
    '2147483648': {tag: 'SHT_LOUSER', dsc: 'Start User-specific. '},
    '4294967295': {tag: 'SHT_HIUSER', dsc: 'Start User-specific. '},
  },
  sh_flags: {
    '1': {tag: 'SHF_WRITE', dsc: 'Writable'},
    '2': {tag: 'SHF_ALLOC', dsc: 'Occupies memory during execution'},
    '4': {tag: 'SHF_EXECINSTR', dsc: 'Executable'},
    '16': {tag: 'SHF_MERGE', dsc: 'Might be merged'},
    '32': {tag: 'SHF_STRINGS', dsc: 'Contains null-terminated strings'},
    '64': {tag: 'SHF_INFO_LINK', dsc: 'sh_info contains SHT index'},
    '128': {tag: 'SHF_LINK_ORDER', dsc: 'Preserve order after combining'},
    '256': {tag: 'SHF_OS_NONCONFORMING', dsc: 'Non-standard OS specific handling required'},
    '512': {tag: 'SHF_GROUP', dsc: 'Section is member of a group'},
    '1024': {tag: 'SHF_TLS', dsc: 'Section hold thread-local data'},
    '267386880': {tag: 'SHF_MASKOS', dsc: 'OS-specific'},
    '4026531840': {tag: 'SHF_MASKPROC', dsc: 'Processor-specific'},
    '67108864': {tag: 'SHF_ORDERED', dsc: 'Special ordering requirement (Solaris)'},
    '134217728': {tag: 'SHF_EXCLUDE', dsc: 'Section is excluded unless referenced or allocated (Solaris)'},
  },
  st_bind: {
    '0': {tag: 'STB_LOCAL', dsc: 'local'},
    '1': {tag: 'STB_GLOBAL', dsc: 'global'},
    '2': {tag: 'STB_WEAK', dsc: 'weak'},
    '10': {tag: 'STB_LOOS', dsc: '(lo_os)'},
    '12': {tag: 'STB_HIOS', dsc: '(hi_os)'},
    '13': {tag: 'STB_LOPROC', dsc: '(lo_proc)'},
    '15': {tag: 'STB_HIPROC', dsc: '(hi_proc)'},
  }
}

const js_elf = {
  wref: [ 'https://en.wikipedia.org/wiki/Executable_and_Linkable_Format',
  'https://raw.githubusercontent.com/corkami/pics/master/binary/elf101/elf101.pdf' ],
  header: {},
  getData: function(){
    return this.data;
  },
  translate: function(){
    // EI_CLASS EI_DATA EI_VERSION EI_OSABI p_type p_flags
    // sh_type sh_flags st_bind
    let dst = JSON.parse(JSON.stringify(this.header));
    dst.header.EI_CLASS   = k_elf.get(k_elf.EI_CLASS, this.header.header.EI_CLASS).dsc;
    dst.header.EI_DATA    = k_elf.get(k_elf.EI_DATA, this.header.header.EI_DATA).dsc;
    dst.header.EI_VERSION = k_elf.get(k_elf.EI_VERSION, this.header.header.EI_VERSION).dsc;
    dst.header.EI_OSABI   = k_elf.get(k_elf.EI_OSABI, this.header.header.EI_OSABI).dsc;
    dst.e_type    = k_elf.get(k_elf.e_type, this.header.e_type).dsc;
    dst.e_machine = k_elf.get(k_elf.e_machine, this.header.e_machine).dsc;
    dst.e_type    = k_elf.get(k_elf.e_type, this.header.e_type).dsc;
    dst.programs  = {};
    this.header.programs.forEach((p) => {
      let o = JSON.parse(JSON.stringify(p));
      o.p_type  = k_elf.get(k_elf.p_type, p.p_type).dsc;
      o.p_flags = k_elf.flags(k_elf.p_flags, 4, p.p_flags);
      dst.programs[k_elf.strHex(p.p_offset) + ": " + o.p_type] = o;
    });
    dst.sections = {};
    this.header.sections.forEach((s) => {
      let o = JSON.parse(JSON.stringify(s));
      o.sh_name = this.getString(s.sh_name);
      o.sh_type = k_elf.get(k_elf.sh_type, s.sh_type).dsc;
      o.sh_flags = k_elf.flags(k_elf.sh_flags, 32, s.sh_flags);
      dst.sections[o.sh_name] = o;
    });
    return dst;
  },
  load: function(r){
    this.header.header = {};
    r.addUInt32(this.header.header, "EI_MAG");
    r.addUInt8(this.header.header, "EI_CLASS","EI_DATA");
    
    k_elf.is64bit = this.header.header.EI_CLASS == 2;
    k_elf.isLE = this.header.header.EI_DATA == 1;
    r.le = k_elf.isLE;
    
    r.addUInt8(this.header.header, "EI_VERSION", "EI_OSABI", "EI_ABIVERSION");
    this.header.header.EI_PAD = r.readUInt8Array(7);
    r.addUInt16(this.header, "e_type", "e_machine");
    r.addUInt32(this.header, "e_version");
    if (k_elf.is64bit)
      r.addUInt64(this.header, "e_entry", "e_phoff", "e_shoff");
    else
      r.addUInt32(this.header, "e_entry", "e_phoff", "e_shoff");
    r.addUInt32(this.header, "e_flags");
    r.addUInt16(this.header, "e_ehsize", "e_phentsize", "e_phnum", "e_shentsize", "e_shnum", "e_shstrndx");

    r.pushOffset(this.header.e_phoff);
    this.header.programs = [];
    for (let i = 0; i < this.header.e_phnum; i++)
      this.header.programs.push(this.getProgram(r))
    r.popOffset()

    this.header.sections = [];
    r.pushOffset(this.header.e_shoff + this.header.e_shstrndx * this.header.e_shentsize);
    var shdr = this.getSectionHeader(r);
    this.setStringTable(r, shdr);
    r.popOffset();
    r.pushOffset(this.header.e_shoff);
    for (let i = 0; i < this.header.e_shnum ; i++)
      this.header.sections.push(this.getSectionHeader(r));
    r.popOffset();
  },
  setStringTable: function(r, shdr){
    r.pushOffset(shdr.sh_offset);
    k_elf.stringTable = r.readUInt8Array(shdr.sh_size);
    r.popOffset();
    return true;
  },
  getString: function(index){
    if (index === 0)
      return "null";
    var str = "";
    var chr = "";
    while(index < k_elf.stringTable.length && (chr = k_elf.stringTable[index++]) != 0)
      str += String.fromCharCode(chr);
    return str;
  },
  getProgram: function(r){
    let o = {};
    if (k_elf.is64bit){
      r.addUInt32(o, "p_type", "p_flags");
      r.addUInt64(o, "p_offset","p_vaddr","p_paddr","p_filesz","p_memsz", "p_align");
    } else {
      r.addUInt32(o, "p_type", "p_offset","p_vaddr","p_paddr","p_filesz","p_memsz", "p_flags", "p_align");
    }
    return o;
  },
  getSectionHeader: function(r){
    let o = {};
    r.addUInt32(o, "sh_name", "sh_type");
    if (k_elf.is64bit){
      r.addUInt64(o, "sh_flags", "sh_addr", "sh_offset", "sh_size");
      r.addUInt32(o, "sh_link", "sh_info");
      r.addUInt64(o, "sh_addralign", "sh_entsize");
    } else {
      r.addUInt32(o, "sh_flags", "sh_addr", "sh_offset", "sh_size", "sh_link", "sh_info", "sh_addralign", "sh_entsize");
    }
    return o;
  },
  EI_NIDENT: {
    load: function(r, dst){
      dst.EI_MAG   = k_elf.strHexTagDsc(32, r.readUInt32(), "EI_MAG", "Magic Number");
      let cls = r.readUInt8();
      let dat = r.readUInt8();
      k_elf.is64bit = cls == 2;
      k_elf.isLE = dat == 1;
      r.le = k_elf.isLE;
      dst.EI_CLASS   = k_elf.str(k_elf.EI_CLASS, 8, cls);
      dst.EI_DATA    = k_elf.str(k_elf.EI_DATA, 8, dat);
      dst.EI_VERSION = k_elf.str(k_elf.EI_VERSION, 8, r.readUInt8());
      dst.EI_OSABI   = k_elf.str(k_elf.EI_OSABI, 8, r.readUInt8());
      dst.EI_ABIVERSION = r.readUInt8();
      dst.EI_PAD = k_elf.strUint8array(r.readUInt8Array(7));
    }
  }
}
