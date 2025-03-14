import { AutoMap } from '@automapper/classes';
import { Base } from 'src/app/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'revenue_tbl' })
export class Revenue extends Base {
  @Column({ name: 'total_amount_column' })
  @AutoMap()
  totalAmount: number;

  @AutoMap()
  @Column({ name: 'date_column' })
  date: Date;

  @AutoMap()
  @Column({ name: 'total_order_column' })
  totalOrder: number;
}
