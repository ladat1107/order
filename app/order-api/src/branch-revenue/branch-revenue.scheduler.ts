import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BranchRevenue } from './branch-revenue.entity';
import { DataSource, Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getCurrentBranchRevenueClause } from './branch-revenue.clause';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import { BranchRevenueQueryResponseDto } from './branch-revenue.dto';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import { plainToInstance } from 'class-transformer';
import { BranchRevenueException } from './branch-revenue.exception';
import { BranchRevenueValidation } from './branch-revenue.validation';
import { TransactionManagerService } from 'src/db/transaction-manager.service';

@Injectable()
export class BranchRevenueScheduler {
  constructor(
    @InjectRepository(BranchRevenue)
    private readonly branchRevenueRepository: Repository<BranchRevenue>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectMapper()
    private readonly mapper: Mapper,
    private readonly transactionManagerService: TransactionManagerService,
  ) {}

  @Timeout(5000)
  async initBranchRevenue() {}

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async refreshBranchRevenue() {
    const context = `${BranchRevenue.name}.${this.refreshBranchRevenue.name}`;
    const results: any[] = await this.branchRevenueRepository.query(
      getCurrentBranchRevenueClause,
    );

    const branchRevenueQueryResponseDtos = plainToInstance(
      BranchRevenueQueryResponseDto,
      results,
    );

    const revenues = branchRevenueQueryResponseDtos.map((item) => {
      return this.mapper.map(
        item,
        BranchRevenueQueryResponseDto,
        BranchRevenue,
      );
    });

    this.transactionManagerService.execute(
      async (manager) => {
        await manager.save(revenues);
      },
      () => {
        this.logger.log(
          `Branch revenue for ${new Date().toISOString()} created successfully`,
          context,
        );
      },
      (error) => {
        this.logger.error(
          `Error when creating branch revenues: ${JSON.stringify(error)}`,
          error.stack,
          context,
        );
        throw new BranchRevenueException(
          BranchRevenueValidation.CREATE_BRANCH_REVENUE_ERROR,
          error.message,
        );
      },
    );
  }
}
