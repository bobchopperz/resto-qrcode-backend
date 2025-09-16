import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, uncolorize, json } = winston.format;

// Format untuk console log agar lebih mudah dibaca saat development
const consoleFormat = combine(
  timestamp(),
  nestWinstonModuleUtilities.format.nestLike('RestoApp', {
    prettyPrint: true,
    colors: true,
  }),
);

// Format untuk file log (JSON terstruktur)
const fileFormat = combine(timestamp(), uncolorize(), json());

export const winstonConfig: winston.LoggerOptions = {
  transports: [
    // 1. Transport untuk menampilkan log di console
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // 2. Transport untuk menyimpan log ke file dengan rotasi harian
    new winston.transports.DailyRotateFile({
      level: 'info', // Hanya log dengan level 'info' ke atas yang akan disimpan
      dirname: 'logs', // Folder untuk menyimpan log
      filename: 'database-%DATE%.log', // Pola nama file
      datePattern: 'YYYY-MM-DD', // Format tanggal untuk rotasi
      zippedArchive: true, // Arsipkan log lama dalam format .gz
      maxSize: '20m', // Ukuran file maksimum sebelum rotasi (misal: 20MB)
      maxFiles: '7d', // Simpan log selama 7 hari
      format: fileFormat,
    }),
  ],
};