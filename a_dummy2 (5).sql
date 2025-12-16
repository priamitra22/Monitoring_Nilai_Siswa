-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 16, 2025 at 02:29 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `a_dummy2`
--

-- --------------------------------------------------------

--
-- Table structure for table `absensi`
--

CREATE TABLE `absensi` (
  `id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `status` enum('Hadir','Sakit','Izin','Alpha') NOT NULL,
  `guru_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `catatan_detail`
--

CREATE TABLE `catatan_detail` (
  `id` int(11) NOT NULL,
  `header_id` int(11) NOT NULL,
  `pengirim_id` int(11) NOT NULL,
  `pesan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `catatan_header`
--

CREATE TABLE `catatan_header` (
  `id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL,
  `orangtua_id` int(11) DEFAULT NULL,
  `siswa_id` int(11) NOT NULL,
  `kategori` enum('Positif','Negatif','Netral') NOT NULL,
  `jenis` enum('Akademik','Perilaku','Kehadiran','Prestasi','Lainnya') NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `mapel_id` int(11) DEFAULT NULL,
  `status` enum('Terkirim','Dibaca') NOT NULL DEFAULT 'Terkirim',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_conversations`
--

CREATE TABLE `chat_conversations` (
  `id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL COMMENT 'ID guru (from guru table)',
  `ortu_id` int(11) NOT NULL COMMENT 'ID orang tua (from orangtua table)',
  `siswa_id` int(11) NOT NULL COMMENT 'ID siswa (context untuk conversation)',
  `tahun_ajaran_id` int(11) NOT NULL COMMENT 'ID tahun ajaran (from tahun_ajaran table)',
  `semester` enum('Ganjil','Genap') NOT NULL COMMENT 'Semester (Ganjil/Genap)',
  `last_message` text DEFAULT NULL COMMENT 'Pesan terakhir (for preview)',
  `last_message_time` timestamp NULL DEFAULT NULL COMMENT 'Waktu pesan terakhir',
  `unread_count_guru` int(11) DEFAULT 0 COMMENT 'Jumlah pesan belum dibaca oleh guru',
  `unread_count_ortu` int(11) DEFAULT 0 COMMENT 'Jumlah pesan belum dibaca oleh ortu',
  `is_archived_guru` tinyint(1) DEFAULT 0 COMMENT 'Archived by guru?',
  `is_archived_ortu` tinyint(1) DEFAULT 0 COMMENT 'Archived by ortu?',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabel percakapan chat antara guru dan orangtua';

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL COMMENT 'ID conversation',
  `sender_id` int(11) NOT NULL COMMENT 'ID user yang kirim (from users table)',
  `sender_role` enum('guru','ortu') NOT NULL COMMENT 'Role pengirim',
  `message` text NOT NULL COMMENT 'Isi pesan',
  `is_read` tinyint(1) DEFAULT 0 COMMENT 'Sudah dibaca?',
  `read_at` timestamp NULL DEFAULT NULL COMMENT 'Waktu dibaca',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabel pesan chat';

-- --------------------------------------------------------

--
-- Table structure for table `guru`
--

CREATE TABLE `guru` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `nip` varchar(20) DEFAULT NULL,
  `status` enum('aktif','tidak-aktif') DEFAULT 'tidak-aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `guru`
--
DELIMITER $$
CREATE TRIGGER `set_guru_status_on_insert` BEFORE INSERT ON `guru` FOR EACH ROW BEGIN
    -- Set status berdasarkan user_id
    IF NEW.user_id IS NOT NULL THEN
        SET NEW.status = 'aktif';
    ELSE
        SET NEW.status = 'tidak-aktif';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_guru_status_on_user_id_change` BEFORE UPDATE ON `guru` FOR EACH ROW BEGIN
    -- Jika user_id berubah dari NULL ke ada nilai, set status = 'aktif'
    IF OLD.user_id IS NULL AND NEW.user_id IS NOT NULL THEN
        SET NEW.status = 'aktif';
    END IF;
    
    -- Jika user_id berubah dari ada nilai ke NULL, set status = 'tidak-aktif'
    IF OLD.user_id IS NOT NULL AND NEW.user_id IS NULL THEN
        SET NEW.status = 'tidak-aktif';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `kelas`
--

CREATE TABLE `kelas` (
  `id` int(11) NOT NULL,
  `nama_kelas` varchar(20) NOT NULL,
  `wali_kelas_id` int(11) DEFAULT NULL,
  `tahun_ajaran_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kelas_mapel`
--

CREATE TABLE `kelas_mapel` (
  `id` int(11) NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `mapel_id` int(11) NOT NULL,
  `guru_id` int(11) NOT NULL,
  `tahun_ajaran_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kelas_siswa`
--

CREATE TABLE `kelas_siswa` (
  `id` int(11) NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `tahun_ajaran_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laporan_resmi`
--

CREATE TABLE `laporan_resmi` (
  `id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `tahun_ajaran_id` int(11) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'Relative path dari uploads/',
  `original_filename` varchar(255) NOT NULL COMMENT 'Original filename dari user',
  `file_size` int(11) NOT NULL COMMENT 'File size in bytes',
  `version` int(11) NOT NULL DEFAULT 1 COMMENT 'Version number untuk laporan yang sama',
  `is_latest` tinyint(1) DEFAULT 1 COMMENT 'TRUE untuk versi terbaru, FALSE untuk versi lama',
  `uploaded_by` int(11) NOT NULL COMMENT 'User ID admin yang upload',
  `upload_date` datetime DEFAULT current_timestamp(),
  `keterangan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mapel`
--

CREATE TABLE `mapel` (
  `id` int(11) NOT NULL,
  `nama_mapel` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nilai`
--

CREATE TABLE `nilai` (
  `id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `kelas_id` int(11) NOT NULL,
  `mapel_id` int(11) NOT NULL,
  `tahun_ajaran_id` int(11) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `lm1_tp1` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM1 TP1',
  `lm1_tp2` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM1 TP2',
  `lm1_tp3` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM1 TP3',
  `lm1_tp4` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM1 TP4',
  `lm2_tp1` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM2 TP1',
  `lm2_tp2` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM2 TP2',
  `lm2_tp3` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM2 TP3',
  `lm2_tp4` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM2 TP4',
  `lm3_tp1` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM3 TP1',
  `lm3_tp2` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM3 TP2',
  `lm3_tp3` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM3 TP3',
  `lm3_tp4` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM3 TP4',
  `lm4_tp1` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM4 TP1',
  `lm4_tp2` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM4 TP2',
  `lm4_tp3` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM4 TP3',
  `lm4_tp4` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM4 TP4',
  `lm5_tp1` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM5 TP1',
  `lm5_tp2` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM5 TP2',
  `lm5_tp3` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM5 TP3',
  `lm5_tp4` decimal(5,2) DEFAULT NULL COMMENT 'Formatif LM5 TP4',
  `lm1_ulangan` decimal(5,2) DEFAULT NULL COMMENT 'Sumatif LM1 (Ulangan)',
  `lm2_ulangan` decimal(5,2) DEFAULT NULL COMMENT 'Sumatif LM2 (Ulangan)',
  `lm3_ulangan` decimal(5,2) DEFAULT NULL COMMENT 'Sumatif LM3 (Ulangan)',
  `lm4_ulangan` decimal(5,2) DEFAULT NULL COMMENT 'Sumatif LM4 (Ulangan)',
  `lm5_ulangan` decimal(5,2) DEFAULT NULL COMMENT 'Sumatif LM5 (Ulangan)',
  `uts` decimal(5,2) DEFAULT NULL COMMENT 'Ujian Tengah Semester',
  `uas` decimal(5,2) DEFAULT NULL COMMENT 'Ujian Akhir Semester',
  `nilai_akhir` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL COMMENT 'User ID yang create',
  `updated_by` int(11) DEFAULT NULL COMMENT 'User ID yang update'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabel nilai siswa dengan sistem Formatif, Sumatif LM, UTS, UAS';

--
-- Triggers `nilai`
--
DELIMITER $$
CREATE TRIGGER `nilai_calculate_insert` BEFORE INSERT ON `nilai` FOR EACH ROW BEGIN
  SET NEW.nilai_akhir = (
    (
      (COALESCE(NEW.lm1_tp1, 0) + COALESCE(NEW.lm1_tp2, 0) + COALESCE(NEW.lm1_tp3, 0) + COALESCE(NEW.lm1_tp4, 0) +
       COALESCE(NEW.lm2_tp1, 0) + COALESCE(NEW.lm2_tp2, 0) + COALESCE(NEW.lm2_tp3, 0) + COALESCE(NEW.lm2_tp4, 0) +
       COALESCE(NEW.lm3_tp1, 0) + COALESCE(NEW.lm3_tp2, 0) + COALESCE(NEW.lm3_tp3, 0) + COALESCE(NEW.lm3_tp4, 0) +
       COALESCE(NEW.lm4_tp1, 0) + COALESCE(NEW.lm4_tp2, 0) + COALESCE(NEW.lm4_tp3, 0) + COALESCE(NEW.lm4_tp4, 0) +
       COALESCE(NEW.lm5_tp1, 0) + COALESCE(NEW.lm5_tp2, 0) + COALESCE(NEW.lm5_tp3, 0) + COALESCE(NEW.lm5_tp4, 0)) / 20
    ) * 0.4 +
    (
      (COALESCE(NEW.lm1_ulangan, 0) + COALESCE(NEW.lm2_ulangan, 0) + COALESCE(NEW.lm3_ulangan, 0) + 
       COALESCE(NEW.lm4_ulangan, 0) + COALESCE(NEW.lm5_ulangan, 0)) / 5
    ) * 0.2 +
    COALESCE(NEW.uts, 0) * 0.2 +
    COALESCE(NEW.uas, 0) * 0.2
  );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `nilai_calculate_update` BEFORE UPDATE ON `nilai` FOR EACH ROW BEGIN
  SET NEW.nilai_akhir = (
    (
      (COALESCE(NEW.lm1_tp1, 0) + COALESCE(NEW.lm1_tp2, 0) + COALESCE(NEW.lm1_tp3, 0) + COALESCE(NEW.lm1_tp4, 0) +
       COALESCE(NEW.lm2_tp1, 0) + COALESCE(NEW.lm2_tp2, 0) + COALESCE(NEW.lm2_tp3, 0) + COALESCE(NEW.lm2_tp4, 0) +
       COALESCE(NEW.lm3_tp1, 0) + COALESCE(NEW.lm3_tp2, 0) + COALESCE(NEW.lm3_tp3, 0) + COALESCE(NEW.lm3_tp4, 0) +
       COALESCE(NEW.lm4_tp1, 0) + COALESCE(NEW.lm4_tp2, 0) + COALESCE(NEW.lm4_tp3, 0) + COALESCE(NEW.lm4_tp4, 0) +
       COALESCE(NEW.lm5_tp1, 0) + COALESCE(NEW.lm5_tp2, 0) + COALESCE(NEW.lm5_tp3, 0) + COALESCE(NEW.lm5_tp4, 0)) / 20
    ) * 0.4 +
    (
      (COALESCE(NEW.lm1_ulangan, 0) + COALESCE(NEW.lm2_ulangan, 0) + COALESCE(NEW.lm3_ulangan, 0) + 
       COALESCE(NEW.lm4_ulangan, 0) + COALESCE(NEW.lm5_ulangan, 0)) / 5
    ) * 0.2 +
    COALESCE(NEW.uts, 0) * 0.2 +
    COALESCE(NEW.uas, 0) * 0.2
  );
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `orangtua`
--

CREATE TABLE `orangtua` (
  `id` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `nik` varchar(16) DEFAULT NULL,
  `kontak` varchar(20) DEFAULT NULL,
  `relasi` enum('Ayah','Ibu','Wali') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orangtua_siswa`
--

CREATE TABLE `orangtua_siswa` (
  `id` int(11) NOT NULL,
  `orangtua_id` int(11) NOT NULL,
  `siswa_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `siswa`
--

CREATE TABLE `siswa` (
  `id` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `nisn` varchar(20) NOT NULL,
  `nik` varchar(20) DEFAULT NULL,
  `jenis_kelamin` enum('Laki-laki','Perempuan') NOT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `tempat_lahir` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tahun_ajaran`
--

CREATE TABLE `tahun_ajaran` (
  `id` int(11) NOT NULL,
  `tahun` varchar(20) NOT NULL,
  `semester` enum('Ganjil','Genap') NOT NULL,
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_selesai` date DEFAULT NULL,
  `status` enum('aktif','tidak-aktif') NOT NULL DEFAULT 'tidak-aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 = Normal login, 1 = Harus ganti password',
  `role` enum('admin','guru','ortu') NOT NULL,
  `status` enum('aktif','tidak-aktif') NOT NULL DEFAULT 'aktif',
  `ortu_id` int(11) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama_lengkap`, `username`, `password`, `must_change_password`, `role`, `status`, `ortu_id`, `last_login`, `created_at`) VALUES
(1, 'Isma', '00000001', '$2b$10$f8Lln6goTnc3vNgcfFizyumb4OfXfl4hm4LjkRiHc1nJrmVLfd2Cq', 0, 'admin', 'aktif', NULL, '2025-12-16 12:27:42', '2025-09-23 17:12:03'),
(64, 'Budi Santoso', '1980010112340001', '$2b$10$Ml4INidEZPJdQoDzMgLQYOo1ITnfRyfeJz5ISiEUoA.4Wh.kTpwdO', 0, 'guru', 'aktif', NULL, '2025-12-16 12:24:07', '2025-11-23 04:35:10'),
(65, 'Siti Nurhaliza', '1981020212340002', '$2b$10$f8Lln6goTnc3vNgcfFizyumb4OfXfl4hm4LjkRiHc1nJrmVLfd2Cq', 1, 'guru', 'aktif', NULL, NULL, '2025-11-23 04:35:10'),
(66, 'Dewi Anggraini', '1982030312340003', '$2b$10$uxFX8drViwVhCSL9oTJoYOl205Lo5yKQoPxGe4tS8X/lD3vmOxSYe', 0, 'guru', 'aktif', NULL, '2025-12-16 12:24:29', '2025-11-23 04:35:10'),
(67, 'Eko Nugroho', '1983040412340004', '$2b$10$hzHIVlBsIH3lO/xlpt6AielQn598z3LbObU4EI4844W2Tj5Jdc1rm', 0, 'guru', 'aktif', NULL, '2025-11-28 18:52:59', '2025-11-23 04:35:10'),
(68, 'Gilang Ramadhan', '1984050512340005', '$2b$10$KyctPv0OFs.K5vGxZ/pgX.XtkC2EMYg233l.LEEJXvuNXDrIJGUM.', 0, 'guru', 'aktif', NULL, '2025-12-12 06:49:06', '2025-11-23 04:35:10'),
(69, 'Hana Prameswari', '1985060612340006', '$2b$10$f8Lln6goTnc3vNgcfFizyumb4OfXfl4hm4LjkRiHc1nJrmVLfd2Cq', 1, 'guru', 'aktif', NULL, NULL, '2025-11-23 04:35:10'),
(70, 'Imam Prasetyo', '1986070712340007', '$2b$10$f8Lln6goTnc3vNgcfFizyumb4OfXfl4hm4LjkRiHc1nJrmVLfd2Cq', 1, 'guru', 'aktif', NULL, NULL, '2025-11-23 04:35:10'),
(71, 'Jasmine Putri', '1987080812340008', '$2b$10$f8Lln6goTnc3vNgcfFizyumb4OfXfl4hm4LjkRiHc1nJrmVLfd2Cq', 1, 'guru', 'aktif', NULL, NULL, '2025-11-23 04:35:10'),
(72, 'Kurniawan Sari', '1988090912340009', '$2b$10$YoorZcIGekOVCU0caFqZz.ABZSIuM3EXzBq5qygOwN7VmRFIWO/zq', 0, 'guru', 'aktif', NULL, '2025-12-12 06:44:37', '2025-11-23 04:35:10'),
(74, 'Abdul Malik', '2025100026', '$2b$10$u7mdjvfDX1iz4H3Cc0hd9ePjBFu4Zc7RmWghEPiSLbIIZ9wCNidHi', 0, 'ortu', 'aktif', 26, '2025-12-16 12:22:49', '2025-11-23 05:20:49'),
(76, 'Ahmad Fauzi', '2025100001', '$2b$10$U89Zodf0161Ek5hzhrXEL.jcNMTaTbi0JTEj/bJxTU6pVyaluWa0u', 0, 'ortu', 'aktif', 1, '2025-12-10 16:53:48', '2025-11-23 08:00:07'),
(77, 'Bella Kartika', '2025100027', '$2b$10$PwMRQh5xfBDuK12O8RegzeTin5KuRs5WBErHcTeNyggkZDbTmaD9i', 0, 'ortu', 'aktif', 27, '2025-12-16 12:28:09', '2025-11-23 08:05:39');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `absensi`
--
ALTER TABLE `absensi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_siswa_kelas_tanggal` (`siswa_id`,`kelas_id`,`tanggal`),
  ADD KEY `guru_id` (`guru_id`),
  ADD KEY `idx_absensi_kelas_id` (`kelas_id`);

--
-- Indexes for table `catatan_detail`
--
ALTER TABLE `catatan_detail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `header_id` (`header_id`),
  ADD KEY `pengirim_id` (`pengirim_id`);

--
-- Indexes for table `catatan_header`
--
ALTER TABLE `catatan_header`
  ADD PRIMARY KEY (`id`),
  ADD KEY `guru_id` (`guru_id`),
  ADD KEY `orangtua_id` (`orangtua_id`),
  ADD KEY `siswa_id` (`siswa_id`),
  ADD KEY `idx_catatan_kelas_id` (`kelas_id`),
  ADD KEY `idx_catatan_mapel_id` (`mapel_id`),
  ADD KEY `idx_catatan_kategori` (`kategori`),
  ADD KEY `idx_catatan_jenis` (`jenis`),
  ADD KEY `idx_catatan_status` (`status`);

--
-- Indexes for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation` (`guru_id`,`ortu_id`,`siswa_id`,`tahun_ajaran_id`,`semester`),
  ADD KEY `idx_guru` (`guru_id`),
  ADD KEY `idx_ortu` (`ortu_id`),
  ADD KEY `idx_siswa` (`siswa_id`),
  ADD KEY `idx_last_message_time` (`last_message_time`),
  ADD KEY `idx_chat_conversations_tahun_ajaran_semester` (`tahun_ajaran_id`,`semester`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversation` (`conversation_id`,`created_at`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `guru`
--
ALTER TABLE `guru`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nip` (`nip`),
  ADD KEY `idx_guru_status` (`status`),
  ADD KEY `idx_guru_user_id` (`user_id`);

--
-- Indexes for table `kelas`
--
ALTER TABLE `kelas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wali_kelas_id` (`wali_kelas_id`),
  ADD KEY `tahun_ajaran_id` (`tahun_ajaran_id`);

--
-- Indexes for table `kelas_mapel`
--
ALTER TABLE `kelas_mapel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_kelas_mapel_tahun` (`kelas_id`,`mapel_id`,`tahun_ajaran_id`),
  ADD KEY `idx_kelas_mapel_kelas_id` (`kelas_id`),
  ADD KEY `idx_kelas_mapel_mapel_id` (`mapel_id`),
  ADD KEY `idx_kelas_mapel_guru_id` (`guru_id`),
  ADD KEY `idx_kelas_mapel_tahun_ajaran_id` (`tahun_ajaran_id`);

--
-- Indexes for table `kelas_siswa`
--
ALTER TABLE `kelas_siswa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_siswa_kelas_tahun` (`siswa_id`,`kelas_id`,`tahun_ajaran_id`),
  ADD KEY `kelas_id` (`kelas_id`),
  ADD KEY `idx_kelas_siswa_tahun_ajaran_id` (`tahun_ajaran_id`);

--
-- Indexes for table `laporan_resmi`
--
ALTER TABLE `laporan_resmi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `idx_siswa` (`siswa_id`),
  ADD KEY `idx_kelas` (`kelas_id`),
  ADD KEY `idx_tahun_ajaran` (`tahun_ajaran_id`),
  ADD KEY `idx_latest` (`is_latest`),
  ADD KEY `idx_semester` (`semester`),
  ADD KEY `idx_composite` (`siswa_id`,`tahun_ajaran_id`,`semester`,`is_latest`),
  ADD KEY `idx_upload_date` (`upload_date`);

--
-- Indexes for table `mapel`
--
ALTER TABLE `mapel`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `nilai`
--
ALTER TABLE `nilai`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_nilai` (`siswa_id`,`kelas_id`,`mapel_id`,`tahun_ajaran_id`,`semester`),
  ADD KEY `idx_siswa` (`siswa_id`),
  ADD KEY `idx_kelas` (`kelas_id`),
  ADD KEY `idx_mapel` (`mapel_id`),
  ADD KEY `idx_tahun_ajaran` (`tahun_ajaran_id`),
  ADD KEY `idx_semester` (`semester`),
  ADD KEY `nilai_ibfk_5` (`created_by`),
  ADD KEY `nilai_ibfk_6` (`updated_by`);

--
-- Indexes for table `orangtua`
--
ALTER TABLE `orangtua`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD KEY `idx_ortu_nik` (`nik`);

--
-- Indexes for table `orangtua_siswa`
--
ALTER TABLE `orangtua_siswa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_ortu_siswa` (`orangtua_id`,`siswa_id`),
  ADD KEY `idx_ortu_siswa_ortu_id` (`orangtua_id`),
  ADD KEY `idx_ortu_siswa_siswa_id` (`siswa_id`);

--
-- Indexes for table `siswa`
--
ALTER TABLE `siswa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nisn` (`nisn`),
  ADD UNIQUE KEY `nik` (`nik`);

--
-- Indexes for table `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_users_ortu_id` (`ortu_id`),
  ADD KEY `idx_users_role` (`role`),
  ADD KEY `idx_users_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `absensi`
--
ALTER TABLE `absensi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `catatan_detail`
--
ALTER TABLE `catatan_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `catatan_header`
--
ALTER TABLE `catatan_header`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guru`
--
ALTER TABLE `guru`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kelas`
--
ALTER TABLE `kelas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kelas_mapel`
--
ALTER TABLE `kelas_mapel`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kelas_siswa`
--
ALTER TABLE `kelas_siswa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `laporan_resmi`
--
ALTER TABLE `laporan_resmi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mapel`
--
ALTER TABLE `mapel`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nilai`
--
ALTER TABLE `nilai`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orangtua`
--
ALTER TABLE `orangtua`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orangtua_siswa`
--
ALTER TABLE `orangtua_siswa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `siswa`
--
ALTER TABLE `siswa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tahun_ajaran`
--
ALTER TABLE `tahun_ajaran`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `absensi`
--
ALTER TABLE `absensi`
  ADD CONSTRAINT `absensi_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`),
  ADD CONSTRAINT `absensi_ibfk_2` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `absensi_ibfk_3` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `catatan_detail`
--
ALTER TABLE `catatan_detail`
  ADD CONSTRAINT `catatan_detail_ibfk_1` FOREIGN KEY (`header_id`) REFERENCES `catatan_header` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `catatan_detail_ibfk_2` FOREIGN KEY (`pengirim_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `catatan_header`
--
ALTER TABLE `catatan_header`
  ADD CONSTRAINT `catatan_header_ibfk_1` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`),
  ADD CONSTRAINT `catatan_header_ibfk_2` FOREIGN KEY (`orangtua_id`) REFERENCES `orangtua` (`id`),
  ADD CONSTRAINT `catatan_header_ibfk_3` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`),
  ADD CONSTRAINT `fk_catatan_kelas` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_catatan_mapel` FOREIGN KEY (`mapel_id`) REFERENCES `mapel` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `chat_conversations_ibfk_1` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_conversations_ibfk_2` FOREIGN KEY (`ortu_id`) REFERENCES `orangtua` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_conversations_ibfk_3` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_conversations_ibfk_4` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `guru`
--
ALTER TABLE `guru`
  ADD CONSTRAINT `guru_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `kelas`
--
ALTER TABLE `kelas`
  ADD CONSTRAINT `kelas_ibfk_1` FOREIGN KEY (`wali_kelas_id`) REFERENCES `guru` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `kelas_ibfk_2` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kelas_mapel`
--
ALTER TABLE `kelas_mapel`
  ADD CONSTRAINT `kelas_mapel_ibfk_1` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kelas_mapel_ibfk_2` FOREIGN KEY (`mapel_id`) REFERENCES `mapel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kelas_mapel_ibfk_3` FOREIGN KEY (`guru_id`) REFERENCES `guru` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kelas_mapel_ibfk_4` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kelas_siswa`
--
ALTER TABLE `kelas_siswa`
  ADD CONSTRAINT `kelas_siswa_ibfk_1` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kelas_siswa_ibfk_2` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kelas_siswa_ibfk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `laporan_resmi`
--
ALTER TABLE `laporan_resmi`
  ADD CONSTRAINT `laporan_resmi_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `laporan_resmi_ibfk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `laporan_resmi_ibfk_3` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `laporan_resmi_ibfk_4` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `nilai`
--
ALTER TABLE `nilai`
  ADD CONSTRAINT `nilai_ibfk_1` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_ibfk_2` FOREIGN KEY (`kelas_id`) REFERENCES `kelas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_ibfk_3` FOREIGN KEY (`mapel_id`) REFERENCES `mapel` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_ibfk_4` FOREIGN KEY (`tahun_ajaran_id`) REFERENCES `tahun_ajaran` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nilai_ibfk_5` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `nilai_ibfk_6` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orangtua_siswa`
--
ALTER TABLE `orangtua_siswa`
  ADD CONSTRAINT `orangtua_siswa_ibfk_1` FOREIGN KEY (`orangtua_id`) REFERENCES `orangtua` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orangtua_siswa_ibfk_2` FOREIGN KEY (`siswa_id`) REFERENCES `siswa` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_ortu` FOREIGN KEY (`ortu_id`) REFERENCES `orangtua` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
