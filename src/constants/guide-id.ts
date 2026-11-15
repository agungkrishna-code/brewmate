import type { GuideArticle } from './guide';

export const GUIDE_ARTICLES_ID: GuideArticle[] = [
  {
    slug: 'v60-basics',
    title: 'V60, langkah demi langkah',
    summary: 'Resep satu cangkir yang konsisten beserta alasan di balik tiap tahap.',
    sections: [
      {
        heading: 'Cara kerja V60',
        blocks: [
          {
            type: 'paragraph',
            text: 'V60 terdiri dari kerucut, kertas filter, dan gravitasi. Air melewati bubuk kopi sekali saja, sehingga ukuran gilingan, cara menuang, dan kertas filter langsung membentuk rasa di cangkir. Metode ini memang tidak sepemaaf French press, tetapi sangat mudah diulang jika variabel lainnya dijaga tetap.',
          },
          {
            type: 'paragraph',
            text: 'Kertas filter menahan sebagian besar minyak dan partikel halus. Dari situlah karakter cangkir yang bersih dan jernih berasal—dan itulah alasan perubahan kecil pada gilingan langsung terasa di lidah.',
          },
        ],
      },
      {
        heading: 'Titik awal yang andal',
        blocks: [
          {
            type: 'table',
            rows: [
              { label: 'Kopi', value: '15 g' },
              { label: 'Air', value: '250 g' },
              { label: 'Rasio', value: '1:16,7' },
              {
                label: 'Gilingan',
                value: 'Sedang-halus',
                hint: 'Sedikit lebih halus dari garam meja. Mulai dari sini lalu biarkan rasa yang menentukan.',
              },
              {
                label: 'Suhu air',
                value: '92 hingga 96°C',
                hint: 'Lebih panas untuk sangrai terang (light), lebih sejuk untuk sangrai gelap.',
              },
              {
                label: 'Total waktu',
                value: 'Sekitar 3:00',
                hint: 'Sekadar petunjuk, bukan target kaku. Cangkir yang enak bisa selesai lebih cepat atau lebih lambat.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Kalkulator Brewmate dimulai di 15 g dan 240 g (1:16). Versi 250 g di atas memakai metode yang sama dengan rasio sedikit lebih longgar. Pilih satu sebagai patokan dan pertahankan saat Anda melakukan dial-in.',
          },
        ],
      },
      {
        heading: 'Urutan tuangan',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                label: '0:00',
                title: 'Bloom',
                text: 'Tuang 50 g, lalu goyangkan dripper perlahan agar seluruh bubuk basah merata. Tunggu hingga 0:45.',
              },
              {
                label: '0:45',
                title: 'Tuang pertama',
                text: 'Tuang memutar perlahan hingga mencapai 100 g.',
              },
              {
                label: '1:10',
                title: 'Tuang kedua',
                text: 'Tuang hingga 150 g.',
              },
              {
                label: '1:30',
                title: 'Tuang ketiga',
                text: 'Tuang hingga 200 g.',
              },
              {
                label: '1:50',
                title: 'Tuang terakhir',
                text: 'Tuang hingga 250 g, lalu beri satu goyangan lembut pada dripper.',
              },
              {
                label: '2:00',
                title: 'Penirisan',
                text: 'Berhenti menuang dan biarkan air turun habis. Usahakan permukaan kopi rata dan selesai di sekitar 3:00.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Struktur ini mengikuti metode V60 satu cangkir dari James Hoffmann. Angka-angka ini adalah referensi, bukan aturan mati.',
          },
        ],
      },
      {
        heading: 'Mengapa tiap tahap penting',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Bloom memberi jalan bagi karbon dioksida yang terperangkap agar keluar, sehingga air bisa mengekstraksi bubuk kopi secara merata.',
              'Tuangan bertahap (pulse pour) memberi agitasi secukupnya lalu membiarkan bed kopi tenang kembali. Ini lebih merata daripada satu tuangan panjang.',
              'Goyangan lembut meratakan permukaan kopi dan menjaga aliran air seragam. Jangan mengaduk terlalu keras.',
              'Permukaan kopi yang rata di akhir seduhan adalah tanda yang baik bahwa tuangan Anda sudah merata.',
            ],
          },
        ],
      },
      {
        heading: 'Jika rasa belum pas',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ubah satu hal saja dalam satu waktu, dimulai dari gilingan. Pertahankan dosis, air, suhu, dan jadwal tuangan agar Anda tahu perubahan mana yang berpengaruh.',
          },
          {
            type: 'paragraph',
            text: 'Jika cangkir terasa asam dan encer, haluskan gilingan. Jika terasa pahit dan kering di lidah, kasarkan gilingan. Artikel dial-in memiliki tabel yang lebih lengkap.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'James Hoffmann, A Better 1 Cup V60 Technique',
        detail: 'Catatan resep Hario USA dan panduan video tahun 2022.',
      },
      {
        label: 'Specialty Coffee Association, Golden Cup Standard',
        detail: 'Rentang referensi rasio seduh, kekuatan, dan ekstraksi.',
      },
    ],
  },
  {
    slug: 'dial-in-grind',
    title: 'Dial-in ukuran gilingan',
    summary: 'Gunakan rasa cangkir dan waktu penirisan untuk menggeser gilingan ke arah yang tepat.',
    sections: [
      {
        heading: 'Jaga patokan tetap stabil',
        blocks: [
          {
            type: 'paragraph',
            text: 'Ukuran gilingan adalah pengubah terbesar yang bisa Anda kendalikan di rumah. Jadikan gilingan satu-satunya variabel yang berubah selama tiga seduhan berturut-turut, sementara dosis, air, suhu, dan jadwal tuangan tetap sama.',
          },
          {
            type: 'bullets',
            items: [
              'Catat angka setelan, waktu penirisan, dan satu kata tentang rasanya.',
              'Geser satu klik, bukan satu putaran penuh.',
              'Cicipi kopi setelah sedikit mendingin. Kopi yang terlalu panas menyembunyikan kemanisan dan aftertaste.',
            ],
          },
        ],
      },
      {
        heading: 'Membaca hasil cangkir',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Asam, encer, selesai sebelum 2:30',
                value: 'Haluskan gilingan',
                hint: 'Air mengalir terlalu cepat untuk mengambil cukup rasa manis.',
              },
              {
                label: 'Seimbang, selesai 2:45 hingga 3:30',
                value: 'Pertahankan setelan',
                hint: 'Waktu sudah berada di rentang ideal. Biarkan rasa yang memutuskan langkah berikutnya.',
              },
              {
                label: 'Pahit, kering, selesai setelah 3:45',
                value: 'Kasarkan gilingan',
                hint: 'Air tertahan terlalu lama di bed kopi, atau terlalu banyak partikel halus (fines).',
              },
              {
                label: 'Asam sekaligus pahit',
                value: 'Tuang lebih lembut dulu',
                hint: 'Ini biasanya tanda channeling. Goyangkan perlahan setelah bloom, hindari aliran menyentuh kertas filter, lalu baru atur gilingan.',
              },
              {
                label: 'Encer tetapi rasanya enak',
                value: 'Perketat rasio',
                hint: 'Kekuatan rasa adalah soal rasio, bukan soal ekstraksi.',
              },
              {
                label: 'Terlalu pekat tetapi enak',
                value: 'Longgarkan rasio',
                hint: 'Tambahkan sedikit air daripada mengubah setelan gilingan.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Pada grinder Anda',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Chestnut S5 Pro',
                value: '90 klik per putaran',
                hint: '15 mikron per klik. TIMEMORE mencantumkan rentang pour-over di 5.0 hingga 8.0 pada dial.',
              },
              {
                label: 'Chestnut C5 Pro',
                value: '48 klik per putaran',
                hint: '31 mikron per klik, 16 langkah makro. TIMEMORE tidak merilis rentang pour-over resmi untuk model ini.',
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'Satu klik pada C5 Pro menggerakkan burr kira-kira dua kali lipat lebih jauh daripada satu klik pada S5 Pro. Ubah satu klik tiap kali pada grinder mana pun, lalu cicipi sebelum mengubah lagi.',
          },
          {
            type: 'note',
            text: 'Jangan pernah menyalin angka klik dari satu model grinder ke model lainnya. Kedua model TIMEMORE ini tidak memakai skala yang sama.',
          },
        ],
      },
      {
        heading: 'Kapan harus berhenti mengubah',
        blocks: [
          {
            type: 'paragraph',
            text: 'Berhentilah saat kemanisan dan aftertaste sudah seimbang sesuai selera Anda. Cangkir yang selesai di 3:40 dan terasa bersih bukanlah masalah yang perlu diperbaiki. Waktu adalah petunjuk, bukan target mutlak.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'BaristaPath, How to dial in grind size for pour over',
        detail: 'Metode patokan dan rentang waktu V60.',
      },
      {
        label: 'Coffee Brew Guide, V60 recipe and troubleshooting',
        detail: 'Tabel waktu penirisan dan solusi umum.',
      },
      {
        label: 'Salford Roasters, V60 troubleshooting without guessing',
        detail: 'Siklus mengubah satu variabel pada satu waktu.',
      },
      {
        label: 'TIMEMORE, halaman produk Chestnut S5 Pro',
        detail: '90 klik, 15 mikron per klik, referensi pour-over 5.0 hingga 8.0.',
      },
    ],
  },
  {
    slug: 'water-and-ratio',
    title: 'Air, rasio dan suhu',
    summary: 'Apa yang mengubah kekuatan rasa, apa yang mengubah ekstraksi, dan apa yang dibiarkan tetap.',
    sections: [
      {
        heading: 'Rasio mengatur kekuatan',
        blocks: [
          {
            type: 'paragraph',
            text: 'Rasio adalah perbandingan berat kopi terhadap air. Rasio lebih rapat seperti 1:15 terasa lebih pekat. Rasio lebih longgar seperti 1:17 terasa lebih ringan. Rasio lebih banyak mengubah kepekatan daripada tingkat ekstraksi.',
          },
          {
            type: 'table',
            rows: [
              { label: 'Rentang umum V60', value: '1:15 hingga 1:17' },
              { label: '15 g kopi pada 1:16', value: '240 g air' },
              { label: '15 g kopi pada 1:16,7', value: '250 g air' },
              {
                label: 'Referensi SCA Golden Cup',
                value: '55 g per liter (±10%)',
                hint: 'Sekitar 1:16,6 hingga 1:20 berdasarkan berat.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Jangan gunakan rasio untuk memperbaiki kopi yang asam atau pahit. Perbaiki ekstraksi lewat gilingan terlebih dahulu, baru atur kepekatan lewat rasio.',
          },
        ],
      },
      {
        heading: 'Suhu air',
        blocks: [
          {
            type: 'paragraph',
            text: 'Referensi SCA adalah 92 hingga 96°C saat air menyentuh bubuk kopi. Teko kehilangan beberapa derajat panas di udara dan pada dripper yang dingin, jadi bilas dan hangatkan V60 beserta kertas filternya terlebih dahulu.',
          },
          {
            type: 'table',
            rows: [
              {
                label: 'Sangrai terang (Light)',
                value: '94 hingga 96°C',
                hint: 'Biji padat membutuhkan energi panas lebih tinggi untuk mengeluarkan kemanisannya.',
              },
              {
                label: 'Sangrai sedang (Medium)',
                value: '92 hingga 94°C',
                hint: 'Titik tengah yang aman untuk sebagian besar kopi washed.',
              },
              {
                label: 'Sangrai gelap (Dark)',
                value: '88 hingga 92°C',
                hint: 'Air yang lebih sejuk menjaga rasa pahit sangrai tidak berlebihan.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Kualitas air',
        blocks: [
          {
            type: 'paragraph',
            text: 'Sebagian besar isi secangkir kopi adalah air. Air bersih tersaring tanpa bau klorin adalah peningkatan paling sederhana. Air yang terlalu keras (tinggi mineral) meredam keasaman dan menajamkan pahit, sedangkan air yang terlalu lunak terasa hambar dan kosong.',
          },
          {
            type: 'bullets',
            items: [
              'Panduan air SCA menyarankan kesadahan total sekitar 50–175 ppm dan alkalinitas 40–70 ppm, dengan pH mendekati 7.',
              'Jika air keran Anda sangat sadah, coba seduh memakai air galon atau filter teko lalu bandingkan. Jika rasa manis muncul, pertahankan air tersebut.',
              'Jangan memakai air suling murni (akuades). Air tanpa mineral tidak mampu mengekstraksi rasa dengan baik.',
            ],
          },
        ],
      },
      {
        heading: 'Apa yang diubah dan kapan',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Seimbang tetapi terlalu encer',
                value: 'Perketat rasio',
                hint: 'Coba 1:15 atau 1:15,5 sebelum mengubah hal lain.',
              },
              {
                label: 'Seimbang tetapi terlalu pekat',
                value: 'Longgarkan rasio',
                hint: 'Coba 1:17 atau tambah 10–20 g air.',
              },
              {
                label: 'Tajam dan kurang matang',
                value: 'Air lebih panas atau gilingan lebih halus',
                hint: 'Ubah satu per satu. Gilingan biasanya memberi efek lebih besar.',
              },
              {
                label: 'Getir dan mengeringkan lidah',
                value: 'Air lebih dingin atau gilingan lebih kasar',
                hint: 'Jika penirisan juga lambat, kasarkan gilingan terlebih dahulu.',
              },
            ],
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Specialty Coffee Association, Golden Cup Standard',
        detail: '55 g per liter, 92–96°C, ekstraksi 18–22 persen.',
      },
      {
        label: 'Ringkasan standar air SCA',
        detail: 'Panduan kesadahan, alkalinitas, dan pH.',
      },
      {
        label: 'Salford Roasters, V60 troubleshooting without guessing',
        detail: 'Kualitas air dan urutan penyesuaian variabel.',
      },
    ],
  },
  {
    slug: 'taste-troubleshooting',
    title: 'Baca rasa cangkir, ubah satu hal',
    summary: 'Kosakata rasa singkat dan perubahan pertama yang perlu dicoba untuk tiap kendala.',
    sections: [
      {
        heading: 'Kenali masalahnya',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Asam (sour) terasa tajam, menusuk, dan terputus cepat. Sering disertai body yang tipis.',
              'Pahit (bitter) terasa kering dan getir seperti teh yang terlalu lama diseduh, bertahan berat di pangkal lidah.',
              'Encer atau kosong berarti cangkir terasa tipis dan kehilangan manis. Ini masalah kekuatan (rasio) sebelum masalah ekstraksi.',
              'Datar atau tumpul berarti tidak ada kesegaran dan tidak manis. Cek kualitas air, kesegaran biji, dan agitasi sebelum menyalahkan gilingan.',
            ],
          },
        ],
      },
      {
        heading: 'Perubahan pertama',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Asam dan tipis, penirisan cepat',
                value: 'Haluskan gilingan',
                hint: 'Lalu jaga tuangan tetap tenang. Jangan panik dengan mengaduk terlalu keras.',
              },
              {
                label: 'Pahit dan kering, penirisan lambat',
                value: 'Kasarkan gilingan',
                hint: 'Tuang lebih rendah dan lembut. Kurangi goyangan di akhir.',
              },
              {
                label: 'Asam sekaligus pahit',
                value: 'Perbaiki channeling',
                hint: 'Basahi seluruh bed saat bloom, tuang melingkar, dan jaga aliran air tidak mengenai kertas filter.',
              },
              {
                label: 'Encer tetapi rasanya enak',
                value: 'Perketat rasio',
                hint: 'Coba 1:15 sebagai pengganti 1:16.',
              },
              {
                label: 'Rasa kertas atau hambar',
                value: 'Bilas kertas filter',
                hint: 'Cek juga tanggal sangrai. Kopi yang sudah lewat segar tidak bisa dipaksa hidup kembali.',
              },
              {
                label: 'Keruh atau berpasir',
                value: 'Kurangi agitasi',
                hint: 'Kurangi jumlah tuangan, perkecil aliran air, dan goyangkan lebih lembut.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Siklus tiga seduhan',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                label: '1',
                title: 'Seduh patokan',
                text: 'Gunakan dosis, air, suhu, dan jadwal tuangan yang sama. Tulis satu kalimat tentang kekurangannya.',
              },
              {
                label: '2',
                title: 'Ubah gilingan',
                text: 'Geser satu klik ke arah yang ditunjukkan rasa. Seduh lagi dengan semua variabel lain tetap sama.',
              },
              {
                label: '3',
                title: 'Atur agitasi',
                text: 'Jika gilingan membantu tetapi belum tuntas, lembutkan tuangan atau tambah satu goyangan terkontrol.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Sebagian besar masalah rasa membaik dalam tiga seduhan jika hanya satu variabel yang digerakkan tiap percobaan.',
          },
        ],
      },
      {
        heading: 'Kesalahan umum',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Mengubah dosis, suhu, dan gilingan sekaligus dalam satu seduhan. Anda tidak akan tahu mana yang berhasil.',
              'Menilai rasa saat kopi masih sangat panas. Kemanisan baru muncul jelas saat suhu mulai turun.',
              'Memakai biji yang sudah basi. Kopi yang baru digiling dari kemasan yang masih segar jauh lebih mudah diprediksi.',
              'Menuang keras tepat di satu titik tengah. Itu melubangi bed kopi dan memaksa air lewat satu jalur saja.',
            ],
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Salford Roasters, V60 troubleshooting without guessing',
        detail: 'Kosakata rasa dan urutan penyesuaian.',
      },
      {
        label: 'Coffee Brew Guide, V60 troubleshooting table',
        detail: 'Gejala, kemungkinan penyebab, dan langkah perbaikan pertama.',
      },
      {
        label: 'BaristaPath, How to dial in grind size for pour over',
        detail: 'Siklus dial-in dan petunjuk waktu.',
      },
    ],
  },
  {
    slug: 'beans-and-freshness',
    title: 'Biji kopi: resting, simpan, giling',
    summary: 'Mengapa satu kemasan terasa berbeda di minggu pertama, minggu ketiga, dan minggu kedelapan.',
    sections: [
      {
        heading: 'Masa istirahat (resting) setelah sangrai',
        blocks: [
          {
            type: 'paragraph',
            text: 'Kopi melepaskan gas karbon dioksida selama berhari-hari setelah disangrai. Terlalu banyak gas menghalangi air mengekstraksi kopi, sehingga biji yang terlalu baru bisa terasa tajam, kosong, atau tidak merata. Sebagian besar roaster menyarankan resting minimal 5–7 hari untuk seduh filter.',
          },
          {
            type: 'table',
            rows: [
              {
                label: '0 hingga 3 hari',
                value: 'Terlalu segar',
                hint: 'Bloom akan sangat mengembang dan rasa belum stabil. Tunggu bila memungkinkan.',
              },
              {
                label: '5 hingga 14 hari',
                value: 'Jendela awal',
                hint: 'Titik mulai yang praktis untuk filter. Rasa mulai hidup meski masih beradaptasi.',
              },
              {
                label: '2 hingga 6 minggu',
                value: 'Masa puncak',
                hint: 'Banyak kopi filter terasa paling manis dan utuh di rentang waktu ini.',
              },
              {
                label: 'Setelah 6 minggu',
                value: 'Mulai menurun',
                hint: 'Masih enak diminum, tetapi aroma dan kompleksitas mulai memudar. Gilingan dan rasio mungkin perlu sedikit disesuaikan.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Tiap roaster berbeda. Sangrai gelap biasanya lebih cepat siap seduh, sedangkan proses anaerobik dan maserasi karbonat sering butuh resting lebih lama. Cicipi dari minggu ke minggu daripada terpaku pada satu angka.',
          },
        ],
      },
      {
        heading: 'Cara menyimpan yang benar',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Simpan biji di kemasan kedap udara atau wadah tertutup dengan katup satu arah jika ada.',
              'Taruh di tempat sejuk, gelap, dan kering. Panas, cahaya, dan lembap mempercepat kopi menjadi apek.',
              'Jangan simpan kopi di kulkas biasa karena mudah menyerap bau dan mengalami kondensasi.',
              'Untuk penyimpanan jangka panjang, bekukan biji utuh dalam porsi sekali seduh dan biarkan mencair dalam keadaan tersegel.',
              'Giling tepat sebelum menyeduh. Bubuk kopi kehilangan aroma hanya dalam hitungan menit.',
            ],
          },
        ],
      },
      {
        heading: 'Hal yang perlu dicatat',
        blocks: [
          {
            type: 'paragraph',
            text: 'Catatan biji kopi berguna jika mampu menjawab pertanyaan Anda bulan depan. Tanggal sangrai jauh lebih penting daripada tanggal beli. Proses dan tingkat sangrai menjelaskan mengapa dua kopi butuh gilingan berbeda.',
          },
          {
            type: 'bullets',
            items: [
              'Tanggal sangrai, agar Anda tahu posisi kopi di masa resting-nya.',
              'Proses dan tingkat sangrai, karena memengaruhi seberapa mudah kopi terekstraksi.',
              'Asal, daerah, dan varietas, agar Anda mudah menemukan karakter cangkir favorit lagi.',
              'Catatan rasa dengan bahasa sendiri. “Gula aren dan kulit jeruk” jauh lebih berguna daripada sekadar angka.',
            ],
          },
        ],
      },
      {
        heading: 'Biji berubah seiring waktu',
        blocks: [
          {
            type: 'paragraph',
            text: 'Setelan yang sempurna di minggu kedua bisa terasa berbeda di minggu kelima. Lakukan dial-in ulang daripada menganggap angka lama selalu cocok. Ubah satu klik dan cicipi sebelum mengubah hal lain.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Partners Coffee, Coffee resting and degassing',
        detail: 'Masa resting untuk filter dan espresso.',
      },
      {
        label: 'Nordic Brew Lab, Resting coffee',
        detail: 'Masa puncak seduh filter dan panduan penyimpanan.',
      },
      {
        label: 'Takumi Brewing Lab, Coffee freshness and storage',
        detail: 'Fase usia kopi dan penyimpanan biji utuh.',
      },
    ],
  },
  {
    slug: 'pour-technique',
    title: 'Teknik tuangan yang merata',
    summary: 'Moncong rendah, putaran lambat, bed yang tenang, dan satu goyangan lembut di akhir.',
    sections: [
      {
        heading: 'Moncong rendah, aliran stabil',
        blocks: [
          {
            type: 'paragraph',
            text: 'Aliran air yang menyambung dari ketinggian rendah mengaduk bed kopi secara lembut. Aliran yang putus-putus di udara kehilangan tenaganya sebelum menyentuh permukaan. Dekatkan moncong teko ke permukaan air dan tuang sekitar 5 gram per detik.',
          },
          {
            type: 'paragraph',
            text: 'Teko leher angsa (gooseneck) sangat membantu, tetapi bukan kewajiban. Yang paling penting adalah aliran terkendali yang bisa Anda ulang dengan konsisten.',
          },
        ],
      },
      {
        heading: 'Melingkar, bukan menyemprot',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Tuang dalam lingkaran lambat dari tengah ke arah luar lalu kembali ke tengah.',
              'Jaga aliran tidak mengenai dinding kertas filter. Air yang mengalir di pinggir kertas tidak melewati kopi.',
              'Jangan menuang keras di satu titik saja karena akan melubangi bed dan menciptakan jalur pintas (channeling).',
              'Sisakan sedikit ruang di bibir kerucut. Jika permukaan air hampir meluap, gilingan mungkin terlalu halus.',
            ],
          },
        ],
      },
      {
        heading: 'Bloom dengan goyangan lembut',
        blocks: [
          {
            type: 'paragraph',
            text: 'Basahi seluruh bubuk kopi, lalu goyangkan dripper perlahan. Tujuannya mencampur air dan kopi secara merata, bukan melempar bubuk ke dinding kertas. Goyangan lembut juga membantu bed rata sebelum tuangan utama.',
          },
        ],
      },
      {
        heading: 'Tuang bertahap, lalu biarkan turun',
        blocks: [
          {
            type: 'paragraph',
            text: 'Tuangan pendek sekitar 50 g memberi agitasi lalu memberi jeda bagi bed untuk turun. Siklus ini menghasilkan ekstraksi yang lebih merata dibanding satu tuangan panjang, sekaligus menjaga suhu slurry tetap stabil pada porsi kecil.',
          },
        ],
      },
      {
        heading: 'Akhiri dengan permukaan rata',
        blocks: [
          {
            type: 'paragraph',
            text: 'Setelah tuangan terakhir, beri satu goyangan lembut pada dripper lalu biarkan turun hingga habis. Permukaan ampas yang rata menandakan ekstraksi berjalan baik. Ampas yang menempel tinggi di dinding kertas biasanya berarti tuangan terlalu melebar ke tepi.',
          },
          {
            type: 'note',
            text: 'Jika cangkir terasa asam dan pahit bersamaan, curigai channeling sebelum mengubah gilingan. Pelankan tuangan dan ratakan bed terlebih dahulu.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'James Hoffmann, A Better 1 Cup V60 Technique',
        detail: 'Ketinggian tuang, laju aliran, dan struktur pulse pour.',
      },
      {
        label: 'Coffee Brew Guide, V60 recipe',
        detail: 'Kerataan bed, kontak kertas, dan tanda channeling.',
      },
    ],
  },
  {
    slug: 'grinder-calibration',
    title: 'Kalibrasi grinder TIMEMORE Anda',
    summary: 'Temukan titik nol, tentukan rentang kerja, dan catat dalam satuan asli grinder.',
    sections: [
      {
        heading: 'Temukan titik nol (zero point)',
        blocks: [
          {
            type: 'steps',
            items: [
              {
                label: '1',
                title: 'Mulai dari posisi longgar',
                text: 'Putar dial ke posisi cukup kasar. Bersihkan sisa bubuk kopi lama dengan kuas.',
              },
              {
                label: '2',
                title: 'Putar menutup perlahan',
                text: 'Putar ke arah halus hingga burr baru saja bersentuhan. Pada S5 Pro, bunyi gesekan tipis saat diberi tekanan samping adalah hal wajar karena celah nolnya sekitar 0,075 mm.',
              },
              {
                label: '3',
                title: 'Mundurkan sedikit',
                text: 'Putar mundur satu atau dua klik ke arah kasar dari titik sentuh. Itulah titik nol praktis Anda untuk mencatat setelan.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Tentukan rentang kerja',
        blocks: [
          {
            type: 'paragraph',
            text: 'Rentang kerja adalah jendela setelan yang menghasilkan rasa enak untuk kopi yang paling sering Anda seduh, bukan satu angka baku. Mulai dari rentang referensi jika ada, seduh, lalu geser satu klik tiap kali.',
          },
          {
            type: 'steps',
            items: [
              {
                label: '1',
                title: 'Seduh patokan',
                text: 'Pakai resep yang sudah Anda percaya dan jangan ubah variabel lain.',
              },
              {
                label: '2',
                title: 'Cicipi dan geser',
                text: 'Lebih halus jika asam dan encer, lebih kasar jika pahit dan kering.',
              },
              {
                label: '3',
                title: 'Catat rentangnya',
                text: 'Simpan batas bawah dan batas atas di Brewmate agar kemasan kopi berikutnya punya titik awal yang jelas.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Dua grinder bawaan Brewmate',
        blocks: [
          {
            type: 'table',
            rows: [
              {
                label: 'Chestnut S5 Pro',
                value: '90 klik, 15 µm per klik',
                hint: 'Referensi pour-over: 5.0 hingga 8.0 pada dial, atau 50 hingga 80 klik.',
              },
              {
                label: 'Chestnut C5 Pro',
                value: '48 klik, 31 µm per klik',
                hint: '16 langkah makro per putaran. Tidak ada rentang pour-over resmi, sehingga catatan Anda sendiri sangat berharga.',
              },
            ],
          },
          {
            type: 'note',
            text: 'Brewmate tidak pernah mengonversi setelan antar model. Satu klik pada satu grinder berbeda maknanya pada grinder lain.',
          },
        ],
      },
      {
        heading: 'Agar catatan tetap berguna',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Catat setelan dalam satuan asli grinder, bukan dalam mikron.',
              'Sertakan nama kopi dan tanggal sangrai agar Anda tahu setelan itu milik biji yang mana.',
              'Tulis rasa dalam satu atau dua kata. “Manis, bulat” sudah cukup.',
              'Saat berganti biji kopi, mulai dari titik tengah rentang kerja Anda lalu lakukan dial-in ulang.',
            ],
          },
        ],
      },
    ],
    sources: [
      {
        label: 'TIMEMORE, halaman produk Chestnut S5 Pro',
        detail: '90 klik per putaran, 15 mikron per klik, referensi pour-over.',
      },
      {
        label: 'TIMEMORE, spesifikasi Chestnut C5 Pro',
        detail: '48 klik per putaran, 31 mikron per klik, 16 langkah makro.',
      },
      {
        label: 'BaristaPath, How to dial in grind size',
        detail: 'Metode dial-in satu variabel.',
      },
    ],
  },
  {
    slug: 'four-six-method',
    title: 'Memahami metode 4:6',
    summary: 'Kerangka lima tuangan ala Tetsu Kasuya untuk menyeimbangkan kemanisan dan kekuatan.',
    sections: [
      {
        heading: 'Konsep dasarnya',
        blocks: [
          {
            type: 'paragraph',
            text: 'Metode 4:6 membagi total air menjadi dua bagian. 40 persen pertama, dituang dalam dua tahap, mengatur keseimbangan manis dan asam. 60 persen sisanya, dituang dalam satu hingga tiga tahap, mengatur kekuatan dan kekentalan (body).',
          },
          {
            type: 'paragraph',
            text: 'Metode ini memakai gilingan lebih kasar dan jeda antar tuangan yang lebih panjang dibanding resep satu cangkir Hoffmann. Jeda itu penting: setiap tuangan sebaiknya turun habis sebelum tuangan berikutnya dimulai.',
          },
        ],
      },
      {
        heading: 'Resep acuan',
        blocks: [
          {
            type: 'table',
            rows: [
              { label: 'Kopi', value: '20 g' },
              { label: 'Air', value: '300 g' },
              { label: 'Rasio', value: '1:15' },
              {
                label: 'Gilingan',
                value: 'Sedang-kasar',
                hint: 'Lebih kasar daripada titik awal V60 pada umumnya.',
              },
              { label: 'Suhu air', value: '92°C' },
              { label: 'Total waktu', value: 'Sekitar 3:30' },
            ],
          },
        ],
      },
      {
        heading: 'Lima tahap tuangan',
        blocks: [
          {
            type: 'steps',
            items: [
              { label: '0:00', title: 'Tuang pertama', text: 'Tuang hingga 60 g.' },
              {
                label: '0:45',
                title: 'Tuang kedua',
                text: 'Tuang hingga 120 g. Ini menyelesaikan 40 persen bagian pertama.',
              },
              { label: '1:30', title: 'Tuang ketiga', text: 'Tuang hingga 180 g.' },
              { label: '2:15', title: 'Tuang keempat', text: 'Tuang hingga 240 g.' },
              {
                label: '3:00',
                title: 'Tuang terakhir',
                text: 'Tuang hingga 300 g. Biarkan air turun habis sekitar 3:30.',
              },
            ],
          },
        ],
      },
      {
        heading: 'Mengatur 40 persen pertama',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Tuang pertama 40 g, kedua 80 g: lebih manis dan keasaman lebih lembut.',
              'Tuang pertama 60 g, kedua 60 g: seimbang.',
              'Tuang pertama 80 g, kedua 40 g: lebih cerah dan keasaman lebih menonjol.',
            ],
          },
        ],
      },
      {
        heading: 'Mengatur 60 persen terakhir',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Satu tuangan 180 g: body lebih ringan dan akhir rasa lebih bersih.',
              'Dua tuangan masing-masing 90 g: kekuatan dan body sedang.',
              'Tiga tuangan masing-masing 60 g: body lebih penuh dan rasa lebih kuat.',
            ],
          },
        ],
      },
      {
        heading: 'Gilingan dan ketepatan waktu',
        blocks: [
          {
            type: 'paragraph',
            text: 'Jika air turun terlalu lambat, kasarkan gilingan. Jika tiap tuangan sudah kering jauh sebelum jadwal tuangan berikutnya tiba, haluskan gilingan. Pertahankan jadwal tuangan sambil menyetel gilingan agar perbandingannya adil.',
          },
          {
            type: 'note',
            text: 'Ini adalah kerangka kerja, bukan resep mati. Ubah pembagian tuangannya saja, jangan mengubah semua variabel sekaligus.',
          },
        ],
      },
    ],
    sources: [
      {
        label: 'Hario Europe, Tetsu Kasuya V60 recipe',
        detail: '20 g kopi, 300 g air, lima tuangan, selesai 3:30.',
      },
      {
        label: 'Honest Coffee Guide, 4:6 method',
        detail: 'Bagaimana pembagian 40 persen dan 60 persen mengubah rasa cangkir.',
      },
    ],
  },
];
