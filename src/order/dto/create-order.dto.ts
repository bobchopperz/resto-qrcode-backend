class OrderItemDto {
  readonly menu_id: string;
  readonly kuantiti: number;
  readonly sub_total: number;
}

export class CreateOrderDto {
  readonly _id: string;
  readonly nama_pelanggan: string;
  readonly no_wa_pelanggan: string;
  readonly orders: OrderItemDto[];
  readonly total_kesuluruhan: number;
  readonly timestamp: { $date: string };
}