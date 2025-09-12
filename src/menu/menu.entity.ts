import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('menu') // Menentukan nama tabel di database menjadi 'menu'
export class Menu {
  @PrimaryGeneratedColumn() // Membuat kolom 'id' sebagai Primary Key yang auto-increment
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 0 }) // Tipe data terbaik untuk harga
  price: number;

  @Column({ name: 'imageUrl', nullable: true }) // Menggunakan snake_case untuk nama kolom & boleh kosong
  imageUrl: string;
}
