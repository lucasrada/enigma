// Test vectors. Every entry is documented in RESEARCH.md §2 with its sources;
// the IDs (V*, H*, S*) match that section. Long strings were copied
// programmatically from the published sources (py-enigma and @ondoher/enigma
// test data, which cite the primary web pages), and the two copies were
// checked against each other where both exist.

// §2.1 Basic vectors
export const BASIC = {
  V1: {
    setup: { model: 'I', reflector: 'B', rotors: ['I', 'II', 'III'], rings: '01 01 01', positions: 'AAA' },
    plaintext: 'AAAAA',
    ciphertext: 'BDZGO',
  },
  // Double-step sequences: rotor windows after each key press.
  V2: { rotors: ['I', 'II', 'III'], start: 'ADU', sequence: ['ADV', 'AEW', 'BFX', 'BFY'] },
  V3: { rotors: ['III', 'II', 'I'], start: 'KDO', sequence: ['KDP', 'KDQ', 'KER', 'LFS', 'LFT', 'LFU'] },
};

// §2.2 Historical messages.
export const HISTORICAL = [
  {
    id: 'H1',
    name: 'Enigma I manual example, 1930',
    sources: [
      'https://cryptocellar.org/enigma/e-message-1930.html',
      'https://en.wikipedia.org/wiki/Grill_(cryptology)',
    ],
    setup: { model: 'I', reflector: 'A', rotors: ['II', 'I', 'III'], rings: '24 13 22', plugboard: 'AM FI NV PS TU WZ' },
    // 1930 procedure: the message key is typed twice at the daily Grundstellung.
    indicator: { start: 'FOL', plain: 'ABLABL', cipher: 'PKPJXI' },
    key: 'ABL',
    ciphertext:
      'GCDSE AHUGW TQGRK VLFGX UCALX VYMIG MMNMF DXTGN VHVRM MEVOU YFZSL '
      + 'RHDRR XFJWC FHUHM UNZEF RDISI KBGPM YVXUZ',
    plaintext:
      'FEINDLIQEINFANTERIEKOLONNEBEOBAQTETXANFANGSUEDAUSGANGBAERWALDEXENDE'
      + 'DREIKMOSTWAERTSNEUSTADT',
  },
  {
    id: 'H2',
    name: 'Operation Barbarossa, 7 July 1941 (part 1)',
    sources: [
      'py-enigma test suite (Rijmenants Enigma Sim manual; Weierud & Sullivan)',
      'http://wiki.franklinheath.co.uk/index.php/Enigma/Sample_Messages',
    ],
    setup: { model: 'I', reflector: 'B', rotors: ['II', 'IV', 'V'], rings: '02 21 12', plugboard: 'AV BS CG DL FU HZ IN KM OW RX' },
    // 1940+ procedure: indicator "WXC KCH" sent in clear; KCH deciphered at WXC is the key.
    indicator: { start: 'WXC', cipher: 'KCH', plain: 'BLA' },
    kenngruppe: 'RFUGZ',
    key: 'BLA',
    ciphertext:
      'EDPUD NRGYS ZRCXN UYTPO MRMBO FKTBZ REZKM LXLVE FGUEY SIOZV EQMIK UBPMM '
      + 'YLKLT TDEIS MDICA GYKUA CTCDO MOHWX MUUIA UBSTS LRNBZ SZWNR FXWFY SSXJZ '
      + 'VIJHI DISHP RKLKA YUPAD TXQSP INQMA TLPIF SVKDA SCTAC DPBOP VHJK',
    plaintext:
      'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXNORDWESTLXSEBEZXSEBEZXUAFFLIEGER'
      + 'STRASZERIQTUNGXDUBROWKIXDUBROWKIXOPOTSCHKAXOPOTSCHKAXUMXEINSAQTDREINULLX'
      + 'UHRANGETRETENXANGRIFFXINFXRGTX',
  },
  {
    id: 'H3',
    name: 'Operation Barbarossa, 7 July 1941 (part 2)',
    sources: ['py-enigma test suite (Rijmenants Enigma Sim manual; Weierud & Sullivan)'],
    setup: { model: 'I', reflector: 'B', rotors: ['II', 'IV', 'V'], rings: '02 21 12', plugboard: 'AV BS CG DL FU HZ IN KM OW RX' },
    indicator: { start: 'CRS', cipher: 'YPJ', plain: 'LSD' },
    kenngruppe: 'FNJAU',
    key: 'LSD',
    ciphertext:
      'SFBWD NJUSE GQOBH KRTAR EEZMW KPPRB XOHDR OEQGB BGTQV PGVKB VVGBI MHUSZ '
      + 'YDAJQ IROAX SSSNR EHYGG RPISE ZBOVM QIEMM ZCYSG QDGRE RVBIL EKXYQ IRGIR '
      + 'QNRDN VRXCY YTNJR',
    plaintext:
      'DREIGEHTLANGSAMABERSIQERVORWAERTSXEINSSIEBENNULLSEQSXUHRXROEMXEINSXINFRGT'
      + 'XDREIXAUFFLIEGERSTRASZEMITANFANGXEINSSEQSXKMXKMXOSTWXKAMENECXK',
  },
  {
    id: 'H4',
    name: 'Scharnhorst (Konteradmiral Bey), 26 December 1943',
    sources: [
      'https://www.bytereef.org/m4-project-scharnhorst-break.html (via py-enigma)',
      'http://wiki.franklinheath.co.uk/index.php/Enigma/Sample_Messages (via @ondoher/enigma)',
    ],
    setup: { model: 'M3', reflector: 'B', rotors: ['III', 'VI', 'VIII'], rings: '01 08 13', plugboard: 'AN EZ HK IJ LR MQ OT PV SW UX' },
    key: 'UZV',
    ciphertext:
      'YKAE NZAP MSCH ZBFO CUVM RMDP YCOF HADZ IZME FXTH FLOL PZLF GGBO TGOX GRET '
      + 'DWTJ IQHL MXVJ WKZU ASTR',
    plaintext:
      'STEUEREJTANAFJORDJANSTANDORTQUAAACCCVIERNEUNNEUNZWOFAHRTZWONULSMXXSCHARN'
      + 'HORSTHCO',
  },
  {
    id: 'H5',
    name: 'U-264 (Kapitänleutnant Looks), 1942 — M4 project first break',
    sources: [
      'https://www.bytereef.org/m4-project-first-break.html',
      'py-enigma test suite (Rijmenants; credited to Stefan Krah)',
      'http://wiki.franklinheath.co.uk/index.php/Enigma/Sample_Messages (via @ondoher/enigma)',
    ],
    setup: { model: 'M4', reflector: 'B-thin', rotors: ['Beta', 'II', 'IV', 'I'], rings: 'A A A V', plugboard: 'AT BL DF GJ HM NW OP QY RZ VX' },
    key: 'VJNA',
    ciphertext:
      'NCZW VUSX PNYM INHZ XMQX SFWX WLKJ AHSH NMCO CCAK UQPM KCSM HKSE INJU SBLK '
      + 'IOSX CKUB HMLL XCSJ USRR DVKO HULX WCCB GVLI YXEO AHXR HKKF VDRE WEZL XOBA '
      + 'FGYU JQUK GRTV UKAM EURB VEKS UHHV OYHA BCJW MAKL FKLM YFVN RIZR VVRT KOFD '
      + 'ANJM OLBG FFLE OPRG TFLV RHOW OPBE KVWM UQFM PWPA RMFH AGKX IIBG',
    plaintext:
      'VONVONJLOOKSJHFFTTTEINSEINSDREIZWOYYQNNSNEUNINHALTXXBEIANGRIFFUNTERWASSER'
      + 'GEDRUECKTYWABOSXLETZTERGEGNERSTANDNULACHTDREINULUHRMARQUANTONJOTANEUNACH'
      + 'TSEYHSDREIYZWOZWONULGRADYACHTSMYSTOSSENACHXEKNSVIERMBFAELLTYNNNNNNOOOVIER'
      + 'YSICHTEINSNULL',
    finalPositions: 'VJWY',
  },
  {
    id: 'H6',
    name: 'U-623 (Schroeder) — M4 project second break',
    sources: [
      'https://www.bytereef.org/m4-project-second-break.html',
      'py-enigma test suite',
    ],
    setup: { model: 'M4', reflector: 'B-thin', rotors: ['Beta', 'II', 'IV', 'I'], rings: 'A A N V', plugboard: 'AT CL DH EP FG IO JN KQ MU RX' },
    key: 'MCSF',
    ciphertext:
      'TMKFNWZXFFIIYXUTIHWMDHXIFZEQVKDVMQSWBQNDYOZFTIWMJHXHYRPACZUGRREMVPANWXGT'
      + 'KTHNRLVHKZPGMNMVSECVCKHOINPLHHPVPXKMBHOKCCPDPEVXVVHOZZQBIYIEOUSEZNHJKWHY'
      + 'DAGTXDJDJKJPKCSDSUZTQCXJDVLPAMGQKKSHPHVKSVPCBUWZFIZPFUUP',
    plaintext:
      'VVVJSCHREEDERJAUFGELEITKURSFUENFFUENFGRADNICHTSGEFUNDENYMARSCAIEREBEFOHL'
      + 'ENESQUADRATXSTANRORTMARQUANTONJOTADREINEUNNEUNFUENFXSSSOOOVIERYSEEDREMY'
      + 'EINSNULYYEINSNULBEDECKTYZWOACHTMBSTEIGTYNBBELSICHTEINSSMT',
  },
  {
    id: 'H7',
    name: 'U-106 (Kapitänleutnant Rasch), "HMS Hurricane" intercept, 25 November 1942',
    sources: [
      'https://enigma.hoerenberg.com/index.php?cat=M4+Project+2006&page=Rasch+Message',
      'py-enigma test suite',
    ],
    setup: { model: 'M4', reflector: 'B-thin', rotors: ['Beta', 'VI', 'I', 'III'], rings: 'Z Z D G', plugboard: 'BQ CR DI EJ KW MT OS PX UZ GH' },
    key: 'NAQL',
    ciphertext:
      'HCEYZTCSOPUPPZDICQRDLWXXFACTTJMBRDVCJJMMZRPYIKHZAWGLYXWTMJPQUEFSZBOTVRLA'
      + 'LZXWVXTSLFFFAUDQFBWRRYAPSBOWJMKLDUYUPFUQDOWVHAHCDWAUARSWTKOFVOYFPUFHVZFD'
      + 'GGPOOVGRMBPXXZCANKMONFHXPCKHJZBUMXJWXKAUODXZUCVCXPFT',
    // The raw decrypt; the published, "degarbled" plaintext differs because the
    // intercept contains transmission errors (RESEARCH.md §3.4).
    plaintext:
      'BOOTKLARXBEIJSCHNOORBETWAZWOSIBENXNOVXSECHSNULCBMXPROVIANTBISZWONULXDEZX'
      + 'BENOETIGEGLMESERYNOCHVIEFKLHRXSTEHEMARQUBRUNOBRUNFZWOFUHFXLAGWWIEJKCHAEF'
      + 'ERJXNNTWWWFUNFYEINSFUNFMBSTEIGENDYGUTESIWXDVVVJRASCH',
  },
  {
    id: 'H8',
    name: 'Dönitz message P1030681 (U-534), 1 May 1945',
    sources: [
      'https://www.cryptomuseum.com/crypto/enigma/msg/p1030681.htm (rings EPEL, start CDSZ)',
      'https://enigma.hoerenberg.com/index.php?cat=The+U534+messages&page=P1030681 (rings AAEL, start YOSZ)',
    ],
    setup: { model: 'M4', reflector: 'C-thin', rotors: ['Beta', 'V', 'VI', 'VIII'], rings: 'E P E L', plugboard: 'AE BF CM DQ HU JN LX PR SZ VW' },
    key: 'CDSZ',
    // The second published setting. It shifts ring and position of the Greek
    // and left wheels together, which is cryptographically identical (§3.3).
    equivalentSetup: { rings: 'A A E L', key: 'YOSZ' },
    ciphertext:
      'LANOTCTOUARBBFPMHPHGCZXTDYGAHGUFXGEWKBLKGJWLQXXTGPJJAVTOCKZFSLPPQIHZFX'
      + 'OEBWIIEKFZLCLOAQJULJOYHSSMBBGWHZANVOIIPYRBRTDJQDJJOQKCXWDNBBTYVXLYTAPG'
      + 'VEATXSONPNYNQFUDBBHHVWEPYEYDOHNLXKZDNWRHDUWUJUMWWVIIWZXIVIUQDRHYMNCYEF'
      + 'UAPNHOTKHKGDNPSAKNUAGHJZSMJBMHVTREQEDGXHLZWIFUSKDQVELNMIMITHBHDBWVHDFY'
      + 'HJOQIHORTDJDBWXEMEAYXGYQXOHFDMYUXXNOJAZRSGHPLWMLRECWWUTLRTTVLBHYOORGLG'
      + 'OWUXNXHMHYFAACQEKTHSJW',
    plaintext:
      'KRKRALLEXXFOLGENDESISTSOFORTBEKANNTZUGEBENXXICHHABEFOLGELNBEBEFEHLERHA'
      + 'LTENXXJANSTERLEDESBISHERIGXNREICHSMARSCHALLSJGOERINGJSETZTDERFUEHRERSI'
      + 'EYHVRRGRZSSADMIRALYALSSEINENNACHFOLGEREINXSCHRIFTLSCHEVOLLMACHTUNTERWE'
      + 'GSXABSOFORTSOLLENSIESAEMTLICHEMASSNAHMENVERFUEGENYDIESICHAUSDERGEGENWA'
      + 'ERTIGENLAGEERGEBENXGEZXREICHSLEITEIKKTULPEKKJBORMANNJXXOBXDXMMMDURNHFK'
      + 'STXKOMXADMXUUUBOOIEXKP',
  },
  {
    id: 'H9',
    name: 'U-534 message P1030662, 1945',
    sources: ['https://enigma.hoerenberg.com/index.php?cat=The%20U534%20messages&page=P1030662 (via @ondoher/enigma)'],
    setup: { model: 'M4', reflector: 'C-thin', rotors: ['Beta', 'V', 'VI', 'VIII'], rings: 'A A E L', plugboard: 'AE BF CM DQ HU JN LX PR SZ VW' },
    key: 'WIIJ',
    ciphertext:
      'LIRZMLWRCDMSNKLKBEBHRMFQFEQAZWXBGBIEXJPYFCQAAWSEKDEACOHDZKCZTOVSYHFNSC'
      + 'MAIMIMMAVJNLFXEWNPUIRINOZNCRVDHCGKCYRVUJQPVKEUIVVXGLQMKRJMDMLXLLRLYBKJ'
      + 'WRXBQRZWGCCNDOPMGCKJ',
    plaintext:
      'UUUVIRSIBENNULEINSYNACHRXUUUSTUETZPUNKTLUEBECKVVVCHEFVIERXUUUFLOTTXXMI'
      + 'TUUUVIERSIBENNULZWOUNDUUUVIERSIBENNULDREIZURFLENDERWERFTLUEBECKGEHENXF'
      + 'ONDORTFOLGTWEITERESX',
  },
];

// §2.3 Synthetic messages from @ondoher/enigma's test data, each verified by
// that project on cryptii and (S2–S9) Palloks' Universal Enigma. They cover
// UKW A, rotor VII, the Gamma wheel and UKW C thin.
export const SYNTHETIC = [
  {
    id: 'S1',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine"],
    setup: { model: 'I', reflector: 'A', rotors: ["II", "IV", "III"], rings: '22 26 26', plugboard: 'IU ZM NK YH SJ DB TX RF OG QE' },
    key: 'ZAE',
    ciphertext:
      'EICSSVSACTFYCNWRBCXMELAKMTBDSSPAIHMUKGFDPVEUHUDWRKOTITUTNWCEJTGUUGVVBO'
      + 'SVOYIDXHBRFYNOAJWISOZDIOPIXJDJJXBUYJWQRMMACUDGZCVHIFPRPCUDDWTXLCEUEASB'
      + 'RVOUFRTQDDOWWGCIEQSAYEXYHLCJHKWRMNQUHERAEGUXBQQDWIZYQHFJZRBZBNGWPUGLUY'
      + 'MUCXFKPPBWXAPRRXZLWBOFPWQHKVXWKHTNJXQCZZROWMYPLSMJINVBUCIPVYZGZXMONPME'
      + 'IFWALQFEKJRRJYXVRNUFWNMPMIYBCQCJNSLNHIHOESEVNFMBKPPQTWQXQMCKIMQNPGOOTK'
      + 'NJDBKKHTWDUSJJGTSFJJLQ',
    plaintext:
      'HOWOTHERWISETHEKINGSIRHATHLAIDTHATINADOZENPASSESBETWEENYOURSELFANDHIMH'
      + 'ESHALLNOTEXCEEDYOUTHREEHITSHEHATHLAIDONTWELVEFORNINEANDITWOULDCOMETOIM'
      + 'MEDIATETRIALIFYOURLORDSHIPWOULDVOUCHSAFETHEANSWERBYTHELORDHORATIOTHESE'
      + 'THREEYEARSIHAVETAKENANOTEOFITTHEAGEISGROWNSOPICKEDTHATTHETOEOFTHEPEASA'
      + 'NTCOMESSONEARTHEHEELOFTHECOURTIERHEGAFFSHISKIBETHYSTATEISTHEMOREGRACIO'
      + 'USFORTISAVICETOKNOWHIM',
  },
  {
    id: 'S2',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "http://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-u_v26_en.html"],
    setup: { model: 'I', reflector: 'B', rotors: ["III", "IV", "I"], rings: '10 22 08', plugboard: 'EL ID YR QP FX HO KJ NS BV WU' },
    key: 'OAK',
    ciphertext:
      'RXDVNGAFUCJOOJHUZZKLZLCIVQZQUJYGRAQSUQWSWFCGJXGDGWWQMTYTLLLGTLWVCSQQIT'
      + 'TKGOEDMERMCMPERRYAZKEDRFSDKWVQUSMGFXLJFOWKIUMTJXKQDBHGPJUKQRTSBTZ',
    plaintext:
      'GOODEVENSIRMAYONEBEPARDONDANDRETAINTHEOFFENCEHOWLONGHATHSHEBEENTHUSTHO'
      + 'UGHTANDAFFLICTIONPASSIONHELLITSELFSHETURNSTOFAVOURANDTOPRETTINESS',
  },
  {
    id: 'S3',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "http://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-u_v26_en.html"],
    setup: { model: 'I', reflector: 'B', rotors: ["III", "I", "II"], rings: '04 05 07', plugboard: 'EJ ZX TU KV MI DB NW GQ LR FO' },
    key: 'OEC',
    ciphertext:
      'WCOJLTOXJZSYRDRGPLWJJOXWFCCISIRBMEHOKYWDFNJFWXCWATBJJTJLTMEQMWBIFXVIBJ'
      + 'JOPAYKSUZIFATKZLMMVHNIYOPHBYKBAAHCYPKELSEWGKBHAHROMIGPBRYQXFCRJGUXWHFK'
      + 'BGTECDZDZLWVIHXKOFBXWJKETDLBLWKDTPPFUFKPKMROJHZMDDBHTKXSWMPNRYOVWEEUIM'
      + 'KYBGVSQJCFNBKKLVYZGKQQRTMMPTWJAMJQPGDCGHLUNQKSVWOAALTXS',
    plaintext:
      'HOWDANGEROUSISITTHATTHISMANGOESLOOSEYETMUSTNOTWEPUTTHESTRONGLAWONHIMHE'
      + 'SLOVEDOFTHEDISTRACTEDMULTITUDEWHOLIKENOTINTHEIRJUDGMENTBUTTHEIREYESAND'
      + 'WHERETISSOTHEOFFENDERSSCOURGEISWEIGHDBUTNEVERTHEOFFENCEAMINOTITHERIGHT'
      + 'OLDJEPHTHAHAHMYGOODLORDWHATHAVEISEENTONIGHTWHATGERTRUDE',
  },
  {
    id: 'S4',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "http://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-u_v26_en.html"],
    setup: { model: 'M3', reflector: 'B', rotors: ["IV", "VII", "I"], rings: '23 13 03', plugboard: 'NI RM AH VQ UL FD GS WY JE TX' },
    key: 'HMP',
    ciphertext:
      'PDWBCHJGYPCHHUXNDVUGEZSYIUATENCFMYUIQPWIBBIELWXUNAWZNPVNKTBOJTHEDWDJJK'
      + 'QEOEPSMJBRGTWJGNURUXXEFYGJKUSHYPFZIDEWODCRKXFFLQKVLRLXNIACDAZEIFJXTLZX'
      + 'USJRLQIDBJTIDUAFRJAYTSNFBJBXKVLASUZQMPCJJLCOZDMDIRPEJANYQCIUPLAPSMQMXX'
      + 'XHSMMNEDCSDDILZOWGPXVWKWKHKYLXEOYFHMNBPURLKA',
    plaintext:
      'COMEHITHERGENTLEMENANDLAYYOURHANDSAGAINUPONMYSWORDNEVERTOSPEAKOFTHISTH'
      + 'ATYOUHAVEHEARDSWEARBYMYSWORDAREYOUFAIRNOMOREBEDONEWESHOULDPROFANETHESE'
      + 'RVICEOFTHEDEADTOSINGAREQUIEMANDSUCHRESTTOHERASTOPEACEPARTEDSOULSNIGGAR'
      + 'DOFQUESTIONBUTOFOURDEMANDSMOSTFREEINHISREPLY',
  },
  {
    id: 'S5',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "http://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-u_v26_en.html"],
    setup: { model: 'M3', reflector: 'B', rotors: ["VI", "IV", "II"], rings: '04 15 21', plugboard: 'QZ DK LA MX ET BG VO SH YP WJ' },
    key: 'ASA',
    ciphertext:
      'URVTSTZATDUFQLGIUJKVRRVJZHSHDOGEKHREOYECTDTBUYZACWNGMHTUGWNUIUJMKHQQAP'
      + 'AKQIQYDHXWBRILLAURPOYTGNYUDANCLJCKSIPCJWLCLBHVXKNNRXPHHJUQJMRBZZASHQLC'
      + 'LQMMTYOA',
    plaintext:
      'EXCHANGEFORGIVENESSWITHMENOBLEHAMLETMINEANDMYFATHERSDEATHCOMENOTUPONTH'
      + 'EENORTHINEONMEHORATIOIAMDEADTHOULIVESTREPORTMEANDMYCAUSEARIGHTTOTHEUNS'
      + 'ATISFIED',
  },
  {
    id: 'S6',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "http://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-u_v26_en.html"],
    setup: { model: 'M3', reflector: 'B', rotors: ["II", "I", "VII"], rings: '19 20 14', plugboard: 'BL SK WD FN HZ IX QU EJ PC OM' },
    key: 'HRO',
    ciphertext:
      'LJVBCURJWLPLFSYKZNBEXTUHTPCWRQTOKBRBCDMAMQCDMIXIOMVCVKBVDXMXIJVELDNRBX'
      + 'PWCCICPEHAXTVZYV',
    plaintext:
      'WHYONEFAIRDAUGHTERANDNOMORETHEWHICHHELOVEDPASSINGWELLYOUTOLDUSOFSOMESU'
      + 'ITWHATISTLAERTES',
  },
  {
    id: 'S7',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "https://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-m4_v16_en.html"],
    setup: { model: 'M4', reflector: 'B-thin', rotors: ["Beta", "II", "VII", "V"], rings: '09 18 12 08', plugboard: 'YL SF VO AI BX WC KD MT JN PH' },
    key: 'MKDM',
    ciphertext:
      'KEKZCUAFFTWOHZURZPCTWWCICFOGAXBTCTPHMAIFXEEBAYFCQOOAGFKWAHOFEUYWBUEZIW'
      + 'ADYATCTLEOUGRPSQDTBZCHIGQGBCXBRYDSGFDBEURKHUKFUYHALYROROKIZWFTPEJJUIRG'
      + 'BIQFGPLGWXJPMNPSEHYSGITZCGSMZXVVJCRXZQWGMOKNBTYVRMYHPWMEXGPUSHYQEWIDZT'
      + 'ITRUFXLPYAQUCZVDCAVCMWGGQMXEQDFPTBLOJDEGTGKXXWFIGASTKMLWHFOPPXNBVDYUHD'
      + 'NOJNATOTMWLJGLSTJXDDHGKOBZCPNTPLPKINICEWVJUUNVKDYWGVFFJE',
    plaintext:
      'YOUNGFORTINBRASWITHCONQUESTCOMEFROMPOLANDTOTHEAMBASSADORSOFENGLANDGIVE'
      + 'STHISWARLIKEVOLLEYNOUPSWORDANDKNOWTHOUAMOREHORRIDHENTWHENHEISDRUNKASLE'
      + 'EPORINHISRAGEORINTHEINCESTUOUSPLEASUREOFHISBEDATGAMINGSWEARINGORABOUTS'
      + 'OMEACTTHATHASNORELISHOFSALVATIONINTTHENTRIPHIMTHATHISHEELSMAYKICKATHEA'
      + 'VENANDTHATHISSOULMAYBEASDAMNDANDBLACKASHELLWHERETOITGOES',
  },
  {
    id: 'S8',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "https://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-m4_v16_en.html"],
    setup: { model: 'M4', reflector: 'C-thin', rotors: ["Gamma", "VIII", "VI", "V"], rings: '07 14 19 26', plugboard: 'RX VA HE ST QL UK PG DB JZ OC' },
    key: 'IBFP',
    ciphertext:
      'PUEDVIRAVXYTNFBCUGMSVLVZYRREYMERJCSCKSCACKBZNZNNLYFAAUIKFRMIIUPWBFSFWV'
      + 'KRYLMKHXKXGJXRFQJNRSLSFGFBBKEVQPWCLKUBMNUUKWIYSUQXAXOGZKSBVCRXMIMNJKOX'
      + 'CUBFXSGYQVUXSAWOFQVDQIYTULXKZXEKCQGXQXFVADTSSVZZGQMHBBMJQBYLUWAJELOIYI'
      + 'CWTDZQAQYPBCAGKHTICILGFKMNRRXGRUTADCIOCQBXHODIRWXARKENICHVMVHWRRIVWWDC'
      + 'G',
    plaintext:
      'IFYOUDOMEETHORATIOANDMARCELLUSTHERIVALSOFMYWATCHBIDTHEMMAKEHASTETHEGRE'
      + 'ATMANDOWNYOUMARKHISFAVOURITEFLIESTHEPOORADVANCEDMAKESFRIENDSOFENEMIESO'
      + 'WONDERFULGOODMYLORDTELLITFORGIVEMETHISMYVIRTUEFORINTHEFATNESSOFTHESEPU'
      + 'RSYTIMESVIRTUEITSELFOFVICEMUSTPARDONBEGYEACURBANDWOOFORLEAVETODOHIMGOO'
      + 'D',
  },
  {
    id: 'S9',
    verifiedWith: ["https://cryptii.com/pipes/enigma-machine", "https://people.physik.hu-berlin.de/~palloks/js/enigma/enigma-m4_v16_en.html"],
    setup: { model: 'M4', reflector: 'B-thin', rotors: ["Gamma", "II", "VIII", "VII"], rings: '25 21 11 02', plugboard: 'SA LM XY CV ER GB KT PJ WH DU' },
    key: 'TQXV',
    ciphertext:
      'NWWKWEOXQKVGAFEMANRTAEGIZIROXKLPEFTWZJEHQVXDIDDXYIDASSXZJUSZTDHEUKPUVN'
      + 'TOONBYOZJAGCMTEFYHCSJCHOHGMXWHLZAVCBRVNGAMTFUNZNVWPAWBXUICZCYKDBSKJZBQ'
      + 'POMBJCJVKSIGJXAXBDZLYAGPSVATCLXXEQVIWUKBOP',
    plaintext:
      'COMEHITHERGENTLEMENANDLAYYOURHANDSAGAINUPONMYSWORDNEVERTOSPEAKOFTHISTH'
      + 'ATYOUHAVEHEARDSWEARBYMYSWORDSEEITSTALKSAWAYSTAYSPEAKSPEAKICHARGETHEESP'
      + 'EAKTISGONEANDWILLNOTANSWERISHALLOBEYMYLORD',
  },
];
