class Elf {
  
  constructor(dataReader){
    this.dataReader = dataReader;
    this.metadata = {};
    this.load(dataReader);
  }

  print(){
    // EI_CLASS EI_DATA EI_VERSION EI_OSABI p_type p_flags
    // sh_type sh_flags st_bind
    let dst = JSON.parse(JSON.stringify(this.metadata));
    
    dst.header.EI_CLASS   = get(EI_CLASS, this.metadata.header.EI_CLASS).dsc;
    dst.header.EI_DATA    = get(EI_DATA, this.metadata.header.EI_DATA).dsc;
    dst.header.EI_VERSION = get(EI_VERSION, this.metadata.header.EI_VERSION).dsc;
    dst.header.EI_OSABI   = get(EI_OSABI, this.metadata.header.EI_OSABI).dsc;
    dst.e_type            = get(e_type, this.metadata.e_type).dsc;
    dst.e_machine         = get(e_machine, this.metadata.e_machine).dsc;
    dst.e_type            = get(e_type, this.metadata.e_type).dsc;
    
    dst.programs  = {};
    this.metadata.programs.forEach((p) => {
      let o = JSON.parse(JSON.stringify(p));
      o.p_type            = get(p_type, p.p_type).dsc;
      o.p_flags           = flags(p_flags, 4, p.p_flags);
      dst.programs[strHex(p.p_offset) + ": " + o.p_type] = o;
    });
    dst.sections = {};
    this.metadata.sections.forEach((s) => {
      let o = JSON.parse(JSON.stringify(s));
      o.sh_name           = this.getString(s.sh_name);
      o.sh_type           = get(sh_type, s.sh_type).dsc;
      o.sh_flags          = flags(sh_flags, 32, s.sh_flags);
      dst.sections[o.sh_name] = o;
    });
    return dst;
  }

  load(r){
    this.metadata.header = {};
    r.addUInt32(this.metadata.header, "EI_MAG");
    r.addUInt8(this.metadata.header, "EI_CLASS","EI_DATA");
    
    is64bit = this.metadata.header.EI_CLASS == 2;
    isLE = this.metadata.header.EI_DATA == 1;
    r.le = isLE;
    
    r.addUInt8(this.metadata.header, "EI_VERSION", "EI_OSABI", "EI_ABIVERSION");
    this.metadata.header.EI_PAD = r.readUInt8Array(7);
    r.addUInt16(this.metadata, "e_type", "e_machine");
    r.addUInt32(this.metadata, "e_version");
    if (is64bit)
      r.addUInt64(this.metadata, "e_entry", "e_phoff", "e_shoff");
    else
      r.addUInt32(this.metadata, "e_entry", "e_phoff", "e_shoff");
    r.addUInt32(this.metadata, "e_flags");
    r.addUInt16(this.metadata, "e_ehsize", "e_phentsize", "e_phnum", "e_shentsize", "e_shnum", "e_shstrndx");

    r.pushOffset(this.metadata.e_phoff);
    this.metadata.programs = [];
    for (let i = 0; i < this.metadata.e_phnum; i++)
      this.metadata.programs.push(this.getProgram(r))
    r.popOffset()

    this.metadata.sections = [];
    r.pushOffset(this.metadata.e_shoff + this.metadata.e_shstrndx * this.metadata.e_shentsize);
    var shdr = this.getSectionHeader(r);
    this.setStringTable(r, shdr);
    r.popOffset();
    r.pushOffset(this.metadata.e_shoff);
    for (let i = 0; i < this.metadata.e_shnum ; i++)
      this.metadata.sections.push(this.getSectionHeader(r));
    r.popOffset();
  }

  setStringTable(r, shdr){
    r.pushOffset(shdr.sh_offset);
    stringTable = r.readUInt8Array(shdr.sh_size);
    r.popOffset();
    return true;
  }

  getString(index){
    if (index === 0)
      return "null";
    var str = "";
    var chr = "";
    while(index < stringTable.length && (chr = stringTable[index++]) != 0)
      str += String.fromCharCode(chr);
    return str;
  }

  getProgram(r){
    let o = {};
    if (is64bit){
      r.addUInt32(o, "p_type", "p_flags");
      r.addUInt64(o, "p_offset","p_vaddr","p_paddr","p_filesz","p_memsz", "p_align");
    } else {
      r.addUInt32(o, "p_type", "p_offset","p_vaddr","p_paddr","p_filesz","p_memsz", "p_flags", "p_align");
    }
    return o;
  }

  getSectionHeader(r){
    let o = {};
    r.addUInt32(o, "sh_name", "sh_type");
    if (is64bit){
      r.addUInt64(o, "sh_flags", "sh_addr", "sh_offset", "sh_size");
      r.addUInt32(o, "sh_link", "sh_info");
      r.addUInt64(o, "sh_addralign", "sh_entsize");
    } else {
      r.addUInt32(o, "sh_flags", "sh_addr", "sh_offset", "sh_size", "sh_link", "sh_info", "sh_addralign", "sh_entsize");
    }
    return o;
  }

  EI_NIDENT = {
    load(r, dst){
      dst.EI_MAG   = strHexTagDsc(32, r.readUInt32(), "EI_MAG", "Magic Number");
      let cls = r.readUInt8();
      let dat = r.readUInt8();
      is64bit = cls == 2;
      isLE = dat == 1;
      r.le = isLE;
      dst.EI_CLASS   = str(EI_CLASS, 8, cls);
      dst.EI_DATA    = str(EI_DATA, 8, dat);
      dst.EI_VERSION = str(EI_VERSION, 8, r.readUInt8());
      dst.EI_OSABI   = str(EI_OSABI, 8, r.readUInt8());
      dst.EI_ABIVERSION = r.readUInt8();
      dst.EI_PAD = strUint8array(r.readUInt8Array(7));
    }
  }

  strHexTagDsc(bits, v, t, dsc) {
    bits /= 8;
    return "0x" + v.toString(16).padStart(bits,'0') + " " + t + ": " + dsc;
  }
  
  strHex(v){
    let pad = Math.floor(Math.log(v)/Math.log(256) + 1) * 2;
    return "0x" + v.toString(16).padStart(pad, '0');
  }

  strUint8array(arr){
    var str = "";
    arr.forEach((b) => str += "0x" + b.toString(16).padStart(2,'0'))+ " ";
    return str.trim();
  }

  str(tbl, bits, v){
    console.log("reading "+JSON.stringify(tbl));
    let e = this.get(tbl, v);
    return this.strHexTagDsc(bits, v, e.tag, e.dsc);
  }

  get(tbl, v){
    return tbl[v.toString()] ? tbl[v.toString()] : tbl["0"];
  }

  flags(tbl, bits, v){
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
  }
  
  EI_CLASS = {
    "0":   {tag: "ELFCLASSNONE",         dsc: "invalid class"},
    "1":   {tag: "ELFCLASS32",           dsc: "32-bit architecture"},
    "2":   {tag: "ELFCLASS64",           dsc: "64-bit architecture"},
  }
  
  EI_DATA = {
    "0":   {tag: "ELFDATANONE",          dsc: "Invalid data enc,oding" },
    "1":   {tag: "ELFDATA2LSB",          dsc: "Two's complement, little-endian"},
    "2":   {tag: "ELFDATA2MSB",          dsc: "Two's complement, big-endian"},
  }

  EI_VERSION =  {
    "0": {tag: "EV_NONE",                dsc: "invalid version"},
    "1": {tag: "EV_CURRENT",             dsc: "Current version"},
  }
  EI_OSABI = {
    "0":   {tag: "ELFOSABI_NONE",        dsc: "unspecified"},
    "1":   {tag: "ELFOSABI_HPUX",        dsc: "HP-UX ABI"},
    "2":   {tag: "ELFOSABI_NETBSD",      dsc: "NetBSD ABI"},
    "3":   {tag: "ELFOSABI_LINUX",       dsc: "Linux ABI"},
    "6":   {tag: "ELFOSABI_SOLARIS",     dsc: "Solaris ABI"},
    "7":   {tag: "ELFOSABI_AIX",         dsc: "AIX ABI"},
    "8":   {tag: "ELFOSABI_IRIX",        dsc: "IRIX ABI"},
    "9":   {tag: "ELFOSABI_FREEBSD",     dsc: "FreeBSD ABI"},
    "10":  {tag: "ELFOSABI_TRU64",       dsc: "Compaq TRU64 UNIX ABI"},
    "11":  {tag: "ELFOSABI_MODESTO",     dsc: "Novell Modesto"},
    "12":  {tag: "ELFOSABI_OPENBSD",     dsc: "Open BSD"},
    "13":  {tag: "ELFOSABI_OPENVMS",     dsc: "Open VMS"},
    "14":  {tag: "ELFOSABI_NSK",         dsc: "Hewlett-Packard Non-Stop Kernel"},
    "15":  {tag: "ELFOSABI_AROS",        dsc: "Aros"},
    "16":  {tag: "ELFOSABI_FENIXOS",     dsc: "FenixOS"},
    "17":  {tag: "ELFOSABI_NUXI",        dsc: "Nuxi CloudABI"},
    "18":  {tag: "ELFOSABI_OPENVOS",     dsc: "Stratus Technologies OpenVOS"},
    "64":  {tag: "ELFOSABI_ARM_AEABI",   dsc: "ARM architecture EABI"},
    "97":  {tag: "ELFOSABI_ARM",         dsc: "ARM architecture ABI"},
    "255": {tag: "ELFOSABI_STANDALONE",  dsc: "Stand-alone (embedded) ABI" },
  }

  e_type = {
    "0":     {tag: "ET_NONE",            dsc: "No file type"},
    "1":     {tag: "ET_REL",             dsc: "Relocatable file"},
    "2":     {tag: "ET_EXEC",            dsc: "Executable file"},
    "3":     {tag: "ET_DYN",             dsc: "Shared object file"},
    "4":     {tag: "ET_CORE",            dsc: "Core file"},
    "65024": {tag: "ET_LOOS",            dsc: "Operating system-specific"},  // 0xfe00
    "65279": {tag: "ET_HIOS",            dsc: "Operating system-specific"},  // 0xfeff
    "65280": {tag: "ET_LOPROC",          dsc: "Processor-specific"},  // 0xff00
    "65535": {tag: "ET_HIPROC",          dsc: "Processor-specific"}, // 0xffff
  }

  e_machine = {
    '0':   { tag: 'EM_NONE',             dsc: "No machine" },
    '1':   { tag: 'EM_M32',              dsc: "AT&T WE 32100" },
    '2':   { tag: 'EM_SPARC',            dsc: "SPARC" },
    '3':   { tag: 'EM_386',              dsc: "Intel 80386" },
    '4':   { tag: 'EM_68K',              dsc: "Motorola 68000" },
    '5':   { tag: 'EM_88K',              dsc: "Motorola 88000" },
    '6':   { tag: 'EM_486',              dsc: "Intel 80486" },
    '7':   { tag: 'EM_860',              dsc: "Intel 80860" },
    '8':   { tag: 'EM_MIPS',             dsc: "MIPS I Architecture" },
    '9':   { tag: 'EM_S370',             dsc: "IBM System/370 Processor" },
    '10':  { tag: 'EM_MIPS_RS3_LE',      dsc: "MIPS RS3000 Little-endian" },
    '15':  { tag: 'EM_PARISC',           dsc: "Hewlett-Packard PA-RISC" },
    '17':  { tag: 'EM_VPP500',           dsc: "Fujitsu VPP500" },
    '18':  { tag: 'EM_SPARC32PLUS',      dsc: "Enhanced instruction set SPARC" },
    '19':  { tag: 'EM_960',              dsc: "Intel 80960" },
    '20':  { tag: 'EM_PPC',              dsc: "PowerPC" },
    '21':  { tag: 'EM_PPC64',            dsc: "64-bit PowerPC" },
    '22':  { tag: 'EM_S390',             dsc: "IBM System/390 Processor" },
    '36':  { tag: 'EM_V800',             dsc: "NEC V800" },
    '37':  { tag: 'EM_FR20',             dsc: "Fujitsu FR20" },
    '38':  { tag: 'EM_RH32',             dsc: "TRW RH-32" },
    '39':  { tag: 'EM_RCE',              dsc: "Motorola RCE" },
    '40':  { tag: 'EM_ARM',              dsc: "Advanced RISC Machines ARM" },
    '41':  { tag: 'EM_ALPHA',            dsc: "Digital Alpha" },
    '42':  { tag: 'EM_SH',               dsc: "Hitachi SH" },
    '43':  { tag: 'EM_SPARCV9',          dsc: "SPARC Version 9" },
    '44':  { tag: 'EM_TRICORE',          dsc: "Siemens TriCore embedded processor" },
    '45':  { tag: 'EM_ARC',              dsc: "Argonaut RISC Core (Argonaut Technologies Inc.)" },
    '46':  { tag: 'EM_H8_300',           dsc: "Hitachi H8/300" },
    '47':  { tag: 'EM_H8_300H',          dsc: "Hitachi H8/300H" },
    '48':  { tag: 'EM_H8S',              dsc: "Hitachi H8S" },
    '49':  { tag: 'EM_H8_500',           dsc: "Hitachi H8/500" },
    '50':  { tag: 'EM_IA_64',            dsc: "Intel IA-64 processor architecture" },
    '51':  { tag: 'EM_MIPS_X',           dsc: "Stanford MIPS-X" },
    '52':  { tag: 'EM_COLDFIRE',         dsc: "Motorola ColdFire" },
    '53':  { tag: 'EM_68HC12',           dsc: "Motorola M68HC12" },
    '54':  { tag: 'EM_MMA',              dsc: "Fujitsu MMA Multimedia Accelerator" },  //
    '55':  { tag: 'EM_PCP',              dsc: "Siemens PCP" },
    '56':  { tag: 'EM_NCPU',             dsc: "Sony nCPU embedded RISC processor" },
    '57':  { tag: 'EM_NDR1',             dsc: "Denso NDR1 microprocessor" },
    '58':  { tag: 'EM_STARCORE',         dsc: "Motorola Star*Core processor" },
    '59':  { tag: 'EM_ME16',             dsc: "Toyota ME16 processor" },
    '60':  { tag: 'EM_ST100',            dsc: "STMicroelectronics ST100 processor" },
    '61':  { tag: 'EM_TINYJ',            dsc: "Advanced Logic Corp. TinyJ embedded processor family" },
    '62':  { tag: 'EM_X86_64',           dsc: "AMD x86-64 architecture" },
    '63':  { tag: 'EM_PDSP',             dsc: "Sony DSP Processor" },
    '64':  { tag: 'EM_PDP10',            dsc: "Digital Equipment Corp. PDP-10" },
    '65':  { tag: 'EM_PDP11',            dsc: "Digital Equipment Corp. PDP-11" },
    '66':  { tag: 'EM_FX66',             dsc: "Siemens FX66 microcontroller" },
    '67':  { tag: 'EM_ST9PLUS',          dsc: "STMicroelectronics ST9+ 8/16 bit microcontroller" },
    '68':  { tag: 'EM_ST7',              dsc: "STMicroelectronics ST7 8-bit microcontroller" },
    '69':  { tag: 'EM_68HC16',           dsc: "Motorola MC68HC16 Microcontroller" },
    '70':  { tag: 'EM_68HC11',           dsc: "Motorola MC68HC11 Microcontroller" },
    '71':  { tag: 'EM_68HC08',           dsc: "Motorola MC68HC08 Microcontroller" },
    '72':  { tag: 'EM_68HC05',           dsc: "Motorola MC68HC05 Microcontroller" },
    '73':  { tag: 'EM_SVX',              dsc: "Silicon Graphics SVx" },
    '74':  { tag: 'EM_ST19',             dsc: "STMicroelectronics ST19 8-bit microcontroller" },
    '75':  { tag: 'EM_VAX',              dsc: "Digital VAX" },
    '76':  { tag: 'EM_CRIS',             dsc: "Axis Communications 32-bit embedded processor" },
    '77':  { tag: 'EM_JAVELIN',          dsc: "Infineon Technologies 32-bit embedded processor" },
    '78':  { tag: 'EM_FIREPATH',         dsc: "Element 14 64-bit DSP Processor" },
    '79':  { tag: 'EM_ZSP',              dsc: "LSI Logic 16-bit DSP Processor" },
    '80':  { tag: 'EM_MMIX',             dsc: "Donald Knuth's educational 64-bit processor" },
    '81':  { tag: 'EM_HUANY',            dsc: "Harvard University machine-independent object files" },
    '82':  { tag: 'EM_PRISM',            dsc: "SiTera Prism" },
    '83':  { tag: 'EM_AVR',              dsc: "Atmel AVR 8-bit microcontroller" },
    '84':  { tag: 'EM_FR30',             dsc: "Fujitsu FR30" },
    '85':  { tag: 'EM_D10V',             dsc: "Mitsubishi D10V" },
    '86':  { tag: 'EM_D30V',             dsc: "Mitsubishi D30V" },
    '87':  { tag: 'EM_V850',             dsc: "NEC v850" },
    '88':  { tag: 'EM_M32R',             dsc: "Mitsubishi M32R" },
    '89':  { tag: 'EM_MN10300',          dsc: "Matsushita MN10300" },
    '90':  { tag: 'EM_MN10200',          dsc: "Matsushita MN10200" },
    '91':  { tag: 'EM_PJ',               dsc: "picoJava" },
    '92':  { tag: 'EM_OPENRISC',         dsc: "OpenRISC 32-bit embedded processor" },
    '93':  { tag: 'EM_ARC_A5',           dsc: "ARC Cores Tangent-A5" },
    '94':  { tag: 'EM_XTENSA',           dsc: "Tensilica Xtensa Architecture" },
    '95':  { tag: 'EM_VIDEOCORE',        dsc: "Alphamosaic VideoCore processor" },
    '96':  { tag: 'EM_TMM_GPP',          dsc: "Thompson Multimedia General Purpose Processor" },
    '97':  { tag: 'EM_NS32K',            dsc: "National Semiconductor 32000 series" },
    '98':  { tag: 'EM_TPC',              dsc: "Tenor Network TPC processor" },
    '99':  { tag: 'EM_SNP1K',            dsc: "Trebia SNP 1000 processor" },
    '100': { tag: 'EM_ST200',            dsc: "STMicroelectronics (www.st.com) ST200 microcontroller" },
    '183': { tag: 'EM_AARCH64',          dsc: "ARM 64-bit architecture (AARCH64)" },
    '190': { tag: 'EM_CUDA',             dsc: "NVIDIA CUDA architecture" },
    '224': { tag: 'EM_AMDGPU',           dsc: "AMD GPU architecture" },
  }

  p_type = {
    "0":          {tag: "PT_NULL",              dsc: "null" },
    "1":          {tag: "PT_LOAD",              dsc: "load" },
    "2":          {tag: "PT_DYNAMIC",           dsc: "dynamic" },
    "3":          {tag: "PT_INTERP",            dsc: "interp" },
    "4":          {tag: "PT_NOTE",              dsc: "note" },
    "5":          {tag: "PT_SHLIB",             dsc: "shlib" },
    "6":          {tag: "PT_PHDR",              dsc: "phdr" },
    "7":          {tag: "PT_TLS",               dsc: "tls" },
    "1610612736": {tag: "PT_LOOS",              dsc: "(lo_os)" },    // 0x60000000
    "1879048191": {tag: "PT_HIOS",              dsc: "(hi_os)" },    // 0x6fffffff
    "1879048192": {tag: "PT_LOPROC",            dsc: "(lo_proc)" },  // 0x70000000
    "2147483647": {tag: "PT_HIPROC",            dsc: "(hi_proc)" },  // 0x7fffffff
  }
  
  p_flags = {
    "1":          {tag: "PF_X",                 dsc: "Executable segment" },
    "2":          {tag: "PF_W",                 dsc: "Writeable segment" },
    "4":          {tag: "PF_R",                 dsc: "Readable segment" },
  }

  sh_type = {
    '0':          {tag: 'SHT_NULL',             dsc: 'Section header table entry unused' },
    '1':          {tag: 'SHT_PROGBITS',         dsc: 'Program data' },
    '2':          {tag: 'SHT_SYMTAB',           dsc: 'Symbol table' },
    '3':          {tag: 'SHT_STRTAB',           dsc: 'String table' },
    '4':          {tag: 'SHT_RELA',             dsc: 'Relocation entries with addends' },
    '5':          {tag: 'SHT_HASH',             dsc: 'Symbol hash table' },
    '6':          {tag: 'SHT_DYNAMIC',          dsc: 'Dynamic linking information' },
    '7':          {tag: 'SHT_NOTE',             dsc: 'Notes' },
    '8':          {tag: 'SHT_NOBITS',           dsc: 'Program space with no data (bss)' },
    '9':          {tag: 'SHT_REL',              dsc: 'Relocation entries, no addends' },
    '10':         {tag: 'SHT_SHLIB',            dsc: 'Reserved' },
    '11':         {tag: 'SHT_DYNSYM',           dsc: 'Dynamic linker symbol table' },
    '14':         {tag: 'SHT_INIT_ARRAY',       dsc: 'Array of constructors' },
    '15':         {tag: 'SHT_FINI_ARRAY',       dsc: 'Array of destructors' },
    '16':         {tag: 'SHT_PREINIT_ARRAY',    dsc: 'Array of pre-constructors' },
    '17':         {tag: 'SHT_GROUP',            dsc: 'Section group' },
    '18':         {tag: 'SHT_SYMTAB_SHNDX',     dsc: 'Extended section indices' },
    '19':         {tag: 'SHT_NUM ',             dsc: 'Number of defined types.' },
    '1610612736': {tag: 'SHT_LOOS ',            dsc: 'Start OS-specific. ' },
    '1879048191': {tag: 'SHT_HIOS',             dsc: 'Start OS-specific. ' },
    '1879048192': {tag: 'SHT_LOPROC',           dsc: 'Start Processor-specific. ' },
    '2147483647': {tag: 'SHT_HIPROC',           dsc: 'Start Processor-specific. ' },
    '2147483648': {tag: 'SHT_LOUSER',           dsc: 'Start User-specific. ' },
    '4294967295': {tag: 'SHT_HIUSER',           dsc: 'Start User-specific. ' },
  }

  sh_flags = {
    '1':          {tag: 'SHF_WRITE',            dsc: 'Writable' },
    '2':          {tag: 'SHF_ALLOC',            dsc: 'Occupies memory during execution' },
    '4':          {tag: 'SHF_EXECINSTR',        dsc: 'Executable' },
    '16':         {tag: 'SHF_MERGE',            dsc: 'Might be merged' },
    '32':         {tag: 'SHF_STRINGS',          dsc: 'Contains null-terminated strings' },
    '64':         {tag: 'SHF_INFO_LINK',        dsc: 'sh_info contains SHT index' },
    '128':        {tag: 'SHF_LINK_ORDER',       dsc: 'Preserve order after combining' },
    '256':        {tag: 'SHF_OS_NONCONFORMING', dsc: 'Non-standard OS specific handling required' },
    '512':        {tag: 'SHF_GROUP',            dsc: 'Section is member of a group' },
    '1024':       {tag: 'SHF_TLS',              dsc: 'Section hold thread-local data' },
    '267386880':  {tag: 'SHF_MASKOS',           dsc: 'OS-specific' },
    '4026531840': {tag: 'SHF_MASKPROC',         dsc: 'Processor-specific' },
    '67108864':   {tag: 'SHF_ORDERED',          dsc: 'Special ordering requirement (Solaris)' },
    '134217728':  {tag: 'SHF_EXCLUDE',          dsc: 'Section is excluded unless referenced or allocated (Solaris)' },
  }

  st_bind = {
    '0': {tag: 'STB_LOCAL', dsc: 'local' },
    '1': {tag: 'STB_GLOBAL', dsc: 'global' },
    '2': {tag: 'STB_WEAK', dsc: 'weak' },
    '10': {tag: 'STB_LOOS', dsc: '(lo_os)' },
    '12': {tag: 'STB_HIOS', dsc: '(hi_os)' },
    '13': {tag: 'STB_LOPROC', dsc: '(lo_proc)' },
    '15': {tag: 'STB_HIPROC', dsc: '(hi_proc)' },
  }
}

class Font {

  constructor(dataReader){
    this.dataReader = dataReader;
    this.header = {};
    this.load(dataReader);
  }

  load(r){
    r.le = false;
    r.addUInt32(this.header, "sfntVersion");
    r.addUInt16(this.header, "numTables","searchRange","entrySelector","rangeShift");
    this.header.tables = {};
    for (let i = 0; i < this.header.numTables; i++){
      let t = this.getTable(r);
      this.header.tables[t.header.tag.replace('/','')] = t;
    }
  }

  getTable(r){
    let table = {tag: r.readString(4)};
    //console.log("table " + table.tag);
    r.addUInt32(table, "checksum","offset","length");
    let dtable =  { header: table };
    // https://stackoverflow.com/questions/1723287/calling-a-javascript-function-named-in-a-variable
    return dtable["header"] ? dtable["header"](r, table) : dtable;
  }
  
  avar = {
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
  } // done
  
  BASE = {
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

  } // done
  
  CBDT = {
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
  } // done
  
  CBLC = {
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
  } // done
  
  CFF = {
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
  } // todo
  
  CFF2 = {
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
  }  // done
  
  COLR = {
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
  }  // done
  
  CPAL = {
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
  }  // todo

  cvar = {
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

  }  // todo

  cvt = {
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
  }  // todo

  cmap = {
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
  }  // done

  DSIG = {
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
  }  // done

  EBDT = {
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
  }
  EBLC = {
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
  }  // done
  EBSC = {
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
  }  // todo

  fpgm = {
    data: {
      header: {},
      desc: 'Font Program',
      web: jsFontCommon.wref + 'fpgm',
    },    
    load: function(r, table){
      this.data.header = table;
      return this.data;
    }
  }  // no tables

  fvar = {
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
        this.data.VariationAxisRecords.push({
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
        this.data.InstanceRecords.push(coordinates);
      }
      r.popOffset();
      return this.data;
    }
  }

  GASP = {
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
  }  // partialy done (todo subtables)

  GDEF = {
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
  }  // partialy done (todo subtables)

  glyf =  { 
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
  }  // todo - no tables

  GPOS = {
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
  }  // partialy done (todo subtables)

  GSUB = {
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
  }  // partialy done (todo subtables)

  gvar = {
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
  } // partialy done (todo subtables)

  hdmx = {
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
  } // partialy done (todo subtables)

  head = {
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
  }  // done

  hhea = {
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
  }  // done

  hmtx = {
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
  }  // todo - no tables

  kern = {
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
  }

  loca = {
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
  }  // depends on maxp.numGlyphs

  maxp = {
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
  } // done
  name = {
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
  }  // done

  OS2 = {
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
  } // done

  post = {
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
      r.addUInt32(this.data, "minMemType42", "maxMemType42", "minMemType1", "maxMemType1");
      r.popOffset();
      return this.data;
    }
  } // done

  PLATFORM_ID = {
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

  NAME_ID = {
    readInt16: function(r){
      let o = {
        index: r.readInt16(),
        tag: "NID_UNKNOWN",
        dsc: "Unkndown",
      };
      const v = [
        { id: "NID_COPYRIGH",    dsc: "Copyright notice"},
        { id: "NID_FAMILY",      dsc: "Font Family name"},
        { id: "NID_SUBFAMILY",   dsc: "Font Subfamily name"},
        { id: "NID_UNFONTID",    dsc: "Unique font identifier"},
        { id: "NID_FULLNAME",    dsc: "Full font name"},
        { id: "NID_VERSION",     dsc: "Version string"},
        { id: "NID_PSTSNAME",    dsc: "PostScript name"},
        { id: "NID_TRADEMRK",    dsc: "Trademark"},
        { id: "NID_MANUFACT",    dsc: "Manufacturer Name"},
        { id: "NID_DESIGNER",    dsc: "Designer Name"},
        { id: "NID_DESCRIPTION", dsc: "Description"},
        { id: "NID_URLVENDOR",   dsc: "URL Vendor"},
        { id: "NID_URLDESIGNER", dsc: "URL Designer"},
        { id: "NID_LICENSEDESC", dsc: "License Description"},
        { id: "NID_LICENSEINFO", dsc: "License Info URL"},
        { id: "NID_RESERVED",    dsc: "Reserved"},
        { id: "NID_TYPOFAMILY",  dsc: "Typographic Family name"},
        { id: "NID_TYPOSUBFAM",  dsc: "Typographic Subfamily name"},
        { id: "NID_MACCOMPAT",   dsc: "Compatible Full (Macintosh only)"},
        { id: "NID_SAMPLETEXT",  dsc: "Sample text"},
        { id: "NID_POSTSCID",    dsc: "PostScript CID findfont name"},
        { id: "NID_WWSFAMILY",   dsc: "WWS Family Name"},
        { id: "NID_WWSSUBFAM",   dsc: "WWS Subfamily Name"},
        { id: "NID_LGTBKGPAL",   dsc: "Light Background Palette"},
        { id: "NID_DRKBKGPAL",   dsc: "Dark Background Palette"},
        { id: "NID_PSVARPRFX",   dsc: "Variations PostScript Name Prefix"}
      ];
      if (o.index >= 0 && o.index < v.length){
        let nameid = v[o.index];
        o.tag = nameid.id;
        o.dsc = nameid.dsc;
      }
      return o;
    }
  }
}