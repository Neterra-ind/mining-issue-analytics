import type { Company, MediaOutlet, Influencer, Issue } from '@/types'

export const companiesSeed: Company[] = [
  { id: 'co-ptar', name: 'PT Agincourt Resources', shortName: 'PTAR', sector: 'Tambang Emas & Perak', isPrimary: true, accentColor: '#1a4d8f' },
  { id: 'co-freeport', name: 'PT Freeport Indonesia', shortName: 'Freeport', sector: 'Tambang Tembaga & Emas', accentColor: '#c98a1f' },
  { id: 'co-antam', name: 'PT Aneka Tambang Tbk', shortName: 'Antam', sector: 'Tambang Emas (UBPE Pongkor)', accentColor: '#7a5c1e' },
]

export const mediaSeed: MediaOutlet[] = [
  { id: 'md-kompas', name: 'Kompas.com', type: 'Online', tier: 'Tier 1' },
  { id: 'md-tempo', name: 'Tempo.co', type: 'Online', tier: 'Tier 1' },
  { id: 'md-cnbc', name: 'CNBC Indonesia', type: 'Online', tier: 'Tier 1' },
  { id: 'md-cnn', name: 'CNN Indonesia', type: 'Online', tier: 'Tier 1' },
  { id: 'md-detik', name: 'Detik.com', type: 'Online', tier: 'Tier 1' },
  { id: 'md-antara', name: 'Antara News', type: 'Online', tier: 'Tier 1' },
  { id: 'md-kontan', name: 'Kontan.co.id', type: 'Online', tier: 'Tier 2' },
  { id: 'md-bisnis', name: 'Bisnis Indonesia', type: 'Cetak', tier: 'Tier 1' },
  { id: 'md-mongabay', name: 'Mongabay Indonesia', type: 'Online', tier: 'Tier 2' },
  { id: 'md-waspada', name: 'Waspada (Medan)', type: 'Cetak', tier: 'Tier 2' },
  { id: 'md-analisa', name: 'Analisa Daily (Medan)', type: 'Cetak', tier: 'Tier 3' },
  { id: 'md-metrotv', name: 'Metro TV', type: 'TV', tier: 'Tier 1' },
  { id: 'md-tvone', name: 'tvOne', type: 'TV', tier: 'Tier 1' },
  { id: 'md-sumutpos', name: 'Sumut Pos', type: 'Online', tier: 'Tier 3' },
]

export const influencersSeed: Influencer[] = [
  { id: 'inf-dirut-ptar', name: 'Muktita Suhartono', position: 'Direktur Utama', organization: 'PT Agincourt Resources', scope: 'Internal', category: 'Direksi' },
  { id: 'inf-corcomm-ptar', name: 'Katarina Siburian Hardono', position: 'VP Corporate Communications', organization: 'PT Agincourt Resources', scope: 'Internal', category: 'Corporate Communication' },
  { id: 'inf-community-ptar', name: 'Rahmat Damanik', position: 'Community Development Manager', organization: 'PT Agincourt Resources', scope: 'Internal', category: 'Community' },
  { id: 'inf-menteri-esdm', name: 'Bahlil Lahadalia', position: 'Menteri ESDM', organization: 'Kementerian ESDM RI', scope: 'External', category: 'Government' },
  { id: 'inf-dirjen-minerba', name: 'Tri Winarno', position: 'Direktur Jenderal Minerba', organization: 'Kementerian ESDM RI', scope: 'External', category: 'Government' },
  { id: 'inf-mahfud', name: 'Mahfud MD', position: 'Tokoh Nasional / Mantan Menko Polhukam', organization: 'Publik', scope: 'External', category: 'Government' },
  { id: 'inf-kadis-esdm-sumut', name: 'Ferdinand Situmorang', position: 'Kepala Dinas ESDM', organization: 'Pemerintah Provinsi Sumatera Utara', scope: 'External', category: 'Government' },
  { id: 'inf-bupati-tapsel', name: 'Dolly Pasaribu', position: 'Bupati', organization: 'Pemerintah Kabupaten Tapanuli Selatan', scope: 'External', category: 'Government' },
  { id: 'inf-dprd-tapsel', name: 'Erwin Siregar', position: 'Ketua Komisi B DPRD', organization: 'DPRD Kabupaten Tapanuli Selatan', scope: 'External', category: 'DPRD' },
  { id: 'inf-walhi', name: 'Dana Prima Tarigan', position: 'Direktur Eksekutif', organization: 'WALHI Sumatera Utara', scope: 'External', category: 'NGO' },
  { id: 'inf-yel', name: 'Rudianto Panjaitan', position: 'Program Manager Konservasi', organization: 'Yayasan Ekosistem Lestari (YEL)', scope: 'External', category: 'NGO' },
  { id: 'inf-akademisi-usu', name: 'Prof. Dr. Ir. Erika Lubis', position: 'Guru Besar Lingkungan', organization: 'Universitas Sumatera Utara', scope: 'External', category: 'Academic' },
  { id: 'inf-apbi', name: 'Hendra Sinaga', position: 'Ketua', organization: 'Asosiasi Pertambangan Batu Bara & Mineral Indonesia', scope: 'External', category: 'Industry Association' },
  { id: 'inf-kobara', name: 'Ompu Sunggu Marpaung', position: 'Koordinator', organization: 'Koalisi Bersama Rakyat (KOBARA)', scope: 'External', category: 'Community' },
  { id: 'inf-analyst', name: 'Wisnu Adiputra', position: 'Analis Komoditas Tambang', organization: 'RHB Sekuritas', scope: 'External', category: 'Analyst' },
]

export const issuesSeed: Issue[] = [
  { id: 'iss-royalti', name: 'Revisi Tarif Royalti Minerba', pillar: 'Industry', relatedPillars: ['Corporate'], category: 'Policy & Regulation', description: 'Pembahasan revisi Peraturan Pemerintah mengenai tarif royalti mineral dan batubara yang berdampak pada biaya produksi perusahaan tambang.', riskLevel: 'Moderate', trend: 'up' },
  { id: 'iss-hilirisasi', name: 'Percepatan Hilirisasi Mineral Nasional', pillar: 'Industry', category: 'Downstreaming', description: 'Dorongan pemerintah untuk mempercepat pembangunan smelter dan hilirisasi mineral strategis nasional.', riskLevel: 'Low', trend: 'up' },
  { id: 'iss-investasi-smelter', name: 'Investasi Fasilitas Pemurnian Emas', pillar: 'Industry', category: 'Investment', description: 'Realisasi dan rencana investasi baru pada fasilitas pengolahan dan pemurnian emas di dalam negeri.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-tambang-ilegal', name: 'Pendanaan Politik dari Tambang Ilegal', pillar: 'Industry', category: 'Illegal Mining', description: 'Dugaan aliran dana dari aktivitas pertambangan ilegal untuk membiayai kegiatan politik, menjadi sorotan tokoh nasional.', riskLevel: 'Critical', trend: 'up' },
  { id: 'iss-produksi-q2', name: 'Kinerja Produksi Emas Semester Berjalan', pillar: 'Industry', category: 'Mining Operation', description: 'Capaian volume produksi emas dan perak perusahaan tambang sepanjang semester berjalan.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-riset-akademik', name: 'Riset Dampak Sosial-Ekonomi Tambang Emas', pillar: 'Industry', relatedPillars: ['Corporate'], category: 'Academic Research', description: 'Studi akademik mengenai dampak sosial dan ekonomi operasi tambang emas terhadap masyarakat sekitar.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-asosiasi-dhe', name: 'Rekomendasi Asosiasi soal Devisa Hasil Ekspor', pillar: 'Industry', category: 'Business', description: 'Sikap asosiasi pertambangan terhadap kebijakan penempatan devisa hasil ekspor (DHE) sumber daya alam.', riskLevel: 'Low', trend: 'stable' },

  { id: 'iss-orangutan', name: 'Ancaman Habitat Orangutan Tapanuli', pillar: 'ESG', relatedPillars: ['Industry', 'Corporate'], category: 'Wildlife', description: 'Kondisi populasi dan habitat Orangutan Tapanuli (Pongo tapanuliensis) di kawasan Ekosistem Batang Toru akibat fragmentasi habitat.', riskLevel: 'High', trend: 'up' },
  { id: 'iss-deforestasi-batangtoru', name: 'Deforestasi Kawasan Hutan Batang Toru', pillar: 'ESG', relatedPillars: ['Industry', 'Corporate'], category: 'Deforestation', description: 'Laju deforestasi di kawasan hutan Batang Toru yang menjadi koridor satwa liar dan daerah tangkapan air.', riskLevel: 'High', trend: 'up' },
  { id: 'iss-restorasi-das', name: 'Program Restorasi Daerah Aliran Sungai', pillar: 'ESG', relatedPillars: ['Corporate'], category: 'Restoration', description: 'Kegiatan reforestasi dan restorasi ekosistem di sekitar daerah aliran sungai konsesi tambang.', riskLevel: 'Low', trend: 'down' },
  { id: 'iss-pencemaran-air', name: 'Dugaan Pencemaran Air Sungai Batang Toru', pillar: 'ESG', relatedPillars: ['Corporate', 'Industry'], category: 'Water Pollution', description: 'Laporan warga dan hasil uji kualitas air terkait dugaan pencemaran aliran Sungai Batang Toru.', riskLevel: 'Critical', trend: 'up' },
  { id: 'iss-longsor-tambang', name: 'Risiko Longsor di Area Terdampak Tambang', pillar: 'ESG', relatedPillars: ['Corporate'], category: 'Mining Impact', description: 'Potensi bencana longsor pada musim hujan di area yang berdekatan dengan aktivitas pertambangan.', riskLevel: 'High', trend: 'stable' },
  { id: 'iss-esg-report', name: 'Publikasi Laporan Keberlanjutan Tahunan', pillar: 'ESG', category: 'ESG Reporting', description: 'Penerbitan sustainability report yang memuat kinerja lingkungan, sosial, dan tata kelola perusahaan.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-greenwashing', name: 'Tudingan Greenwashing dalam Klaim ESG', pillar: 'ESG', relatedPillars: ['Corporate'], category: 'Greenwashing', description: 'Kritik LSM terhadap klaim keberlanjutan perusahaan yang dinilai tidak sepenuhnya didukung data lapangan.', riskLevel: 'Moderate', trend: 'up' },
  { id: 'iss-esg-award', name: 'Penghargaan ESG dan Green PROPER', pillar: 'ESG', relatedPillars: ['Corporate'], category: 'ESG Award', description: 'Pencapaian peringkat PROPER Hijau dan penghargaan keberlanjutan lain dari pemerintah dan lembaga independen.', riskLevel: 'Low', trend: 'down' },

  { id: 'iss-dividen-kobara', name: 'Tuntutan Pembagian Manfaat oleh KOBARA', pillar: 'Corporate', relatedPillars: ['Industry'], category: 'Government Relations', description: 'Tuntutan koalisi masyarakat sekitar tambang atas pembagian manfaat/dividen dari hasil operasi tambang emas Martabe.', riskLevel: 'High', trend: 'up' },
  { id: 'iss-csr-pendidikan', name: 'Program Beasiswa dan CSR Pendidikan', pillar: 'Corporate', category: 'Education', description: 'Program beasiswa dan bantuan fasilitas pendidikan bagi masyarakat lingkar tambang.', riskLevel: 'Low', trend: 'down' },
  { id: 'iss-csr-kesehatan', name: 'Program Kesehatan Masyarakat Lingkar Tambang', pillar: 'Corporate', category: 'Community', description: 'Kegiatan layanan kesehatan gratis dan perbaikan gizi untuk masyarakat di sekitar area operasi.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-tenaga-kerja-lokal', name: 'Serapan Tenaga Kerja Lokal', pillar: 'Corporate', category: 'Operation', description: 'Proporsi dan program peningkatan kapasitas tenaga kerja lokal Tapanuli Selatan dalam operasi tambang.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-hubungan-pemda', name: 'Koordinasi dengan Pemerintah Daerah', pillar: 'Corporate', category: 'Government Relations', description: 'Pertemuan dan koordinasi rutin perusahaan dengan Pemkab Tapanuli Selatan dan Pemprov Sumatera Utara.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-media-visit', name: 'Kunjungan Media dan Transparansi Operasi', pillar: 'Corporate', relatedPillars: ['ESG'], category: 'Media Relations', description: 'Kunjungan lapangan jurnalis ke area tambang untuk transparansi praktik operasi dan pengelolaan lingkungan.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-kinerja-korporasi', name: 'Kinerja Keuangan dan Produksi Kuartalan', pillar: 'Corporate', relatedPillars: ['Industry'], category: 'Corporate Performance', description: 'Pencapaian target produksi, kontribusi pajak, dan royalti perusahaan pada periode berjalan.', riskLevel: 'Low', trend: 'stable' },
  { id: 'iss-demo-buruh', name: 'Aksi Unjuk Rasa Serikat Pekerja', pillar: 'Corporate', category: 'Operation', description: 'Aksi unjuk rasa terkait tuntutan kesejahteraan oleh serikat pekerja tambang di sekitar area operasi.', riskLevel: 'Moderate', trend: 'stable' },
]
