import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ProductAnalysis } from './product-analysis.entity';
import { Between, DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression, Timeout } from '@nestjs/schedule';
import * as _ from 'lodash';
import {
  getAllProductAnalysisClause,
  getYesterdayProductAnalysisClause,
} from './product-analysis.clause';
import { plainToInstance } from 'class-transformer';
import { ProductAnalysisQueryDto } from './product-analysis.dto';
import { Branch } from 'src/branch/branch.entity';
import { BranchException } from 'src/branch/branch.exception';
import { BranchValidation } from 'src/branch/branch.validation';
import { Product } from 'src/product/product.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ProductException } from 'src/product/product.exception';
import ProductValidation from 'src/product/product.validation';
import { InjectMapper } from '@automapper/nestjs';
import { Mapper } from '@automapper/core';
import moment from 'moment';
import { ProductAnalysisUtils } from './product-analysis.utils';

@Injectable()
export class ProductAnalysisScheduler {
  constructor(
    @InjectRepository(ProductAnalysis)
    private readonly productAnalysisRepository: Repository<ProductAnalysis>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectMapper()
    private readonly mapper: Mapper,
    private readonly dataSource: DataSource,
    private readonly productAnalysisUtils: ProductAnalysisUtils,
  ) {}

  @Timeout(5000)
  async initProductAnalysis() {
    const context = `${ProductAnalysisScheduler.name}.${this.initProductAnalysis.name}`;
    const hasProductAnalysis = await this.productAnalysisRepository.find({});

    if (!_.isEmpty(hasProductAnalysis)) {
      this.logger.log(`Product analysis existed`, context);
      return;
    }

    const results: any[] = await this.productAnalysisRepository.query(
      getAllProductAnalysisClause,
    );

    const productAnalysisQueryDtos = plainToInstance(
      ProductAnalysisQueryDto,
      results,
    );
    // const filledZeroProductAnalysis =
    //   await this.productAnalysisUtils.fillZeroProductAnalysis(
    //     productAnalysisQueryDtos,
    //     true,
    //   );

    const groupedProductAnalysisByProduct: ProductAnalysisQueryDto[][] =
      this.productAnalysisUtils.groupProductAnalysisByProduct(
        productAnalysisQueryDtos,
      );
    const updateProducts: Product[] = [];
    const productAnalysesPromise = groupedProductAnalysisByProduct.map(
      async (groupedItem) => {
        const product = await this.productRepository.findOne({
          where: {
            id: _.first(groupedItem).productId,
          },
        });
        if (!product)
          throw new ProductException(ProductValidation.PRODUCT_NOT_FOUND);
        let totalSaleQuantity = product.saleQuantityHistory;

        const productAnalysesByProductPromise = groupedItem.map(
          async (item) => {
            const branch = await this.branchRepository.findOne({
              where: { id: item.branchId },
            });
            if (!branch)
              throw new BranchException(BranchValidation.BRANCH_NOT_FOUND);

            const pa = this.mapper.map(
              item,
              ProductAnalysisQueryDto,
              ProductAnalysis,
            );
            totalSaleQuantity += pa.totalQuantity;
            pa.branch = branch;
            pa.product = product;
            return pa;
          },
        );
        const productAnalysesByProduct = await Promise.all(
          productAnalysesByProductPromise,
        );
        product.saleQuantityHistory = totalSaleQuantity;
        updateProducts.push(product);

        return productAnalysesByProduct;
      },
    );

    // Insert
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const productAnalyses = await Promise.all(productAnalysesPromise);
      const productAnalysesArr: ProductAnalysis[] = _.flatten(productAnalyses);
      await queryRunner.manager.save(productAnalysesArr);
      await queryRunner.manager.save(updateProducts);
      await queryRunner.commitTransaction();
      this.logger.log(
        `Init product analysis ${productAnalysesArr.length}`,
        context,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Error when init product analysis: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  // @Timeout(1000)
  async refreshProductAnalysis() {
    const context = `${ProductAnalysisScheduler.name}.${this.refreshProductAnalysis.name}`;

    try {
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      yesterdayDate.setHours(7, 0, 0, 0);

      const hasProductAnalysis = await this.productAnalysisRepository.find({
        where: {
          orderDate: yesterdayDate,
        },
      });

      if (!_.isEmpty(hasProductAnalysis)) {
        this.logger.error(
          `Product analysis ${moment(yesterdayDate).format('YYYY-MM-DD')} existed`,
          null,
          context,
        );
        return;
      }

      const results: any[] = await this.productAnalysisRepository.query(
        getYesterdayProductAnalysisClause,
      );

      const productAnalysisQueryDtos = plainToInstance(
        ProductAnalysisQueryDto,
        results,
      );

      const groupedProductAnalysisByProduct: ProductAnalysisQueryDto[][] =
        this.productAnalysisUtils.groupProductAnalysisByProduct(
          productAnalysisQueryDtos,
        );

      const refreshDate = new Date();
      refreshDate.setDate(refreshDate.getDate() - 1);
      refreshDate.setHours(7, 0, 0, 0);

      const updateProducts: Product[] = [];
      const productAnalysesPromise = groupedProductAnalysisByProduct.map(
        async (groupedItem) => {
          const product = await this.productRepository.findOne({
            where: {
              id: _.first(groupedItem).productId,
            },
          });
          if (!product)
            throw new ProductException(ProductValidation.PRODUCT_NOT_FOUND);
          let newTotalSaleQuantity = product.saleQuantityHistory;
          const oldTotalSaleQuantity = product.saleQuantityHistory;

          const hasProductAnalysesByProduct: ProductAnalysis[] =
            await this.productAnalysisRepository.find({
              where: {
                product: { id: product.id },
                orderDate: Between(refreshDate, refreshDate),
              },
              relations: ['branch', 'product'],
            });

          const productAnalysesByProductPromise = groupedItem.map(
            async (item) => {
              const branch = await this.branchRepository.findOne({
                where: { id: item.branchId },
              });
              if (!branch)
                throw new BranchException(BranchValidation.BRANCH_NOT_FOUND);

              const existedProductAnalysis = hasProductAnalysesByProduct.find(
                (hasItem) =>
                  hasItem.product.id === item.productId &&
                  hasItem.branch.id === item.branchId &&
                  moment(item.orderDate).add(7, 'hours').toDate().getTime() ===
                    new Date(hasItem.orderDate).getTime(),
                // add 7 hours because mapper ProductAnalysisQueryDto to ProductAnalysis
              );

              if (existedProductAnalysis) {
                if (
                  existedProductAnalysis.totalQuantity !== item.totalProducts
                ) {
                  Object.assign(existedProductAnalysis, {
                    totalQuantity: item.totalProducts,
                  });
                  newTotalSaleQuantity -= existedProductAnalysis.totalQuantity; // subtract old total quantity
                  newTotalSaleQuantity += item.totalProducts; // add new total quantity
                  return existedProductAnalysis;
                }
              } else {
                const pa = this.mapper.map(
                  item,
                  ProductAnalysisQueryDto,
                  ProductAnalysis,
                );
                newTotalSaleQuantity += pa.totalQuantity;
                pa.branch = branch;
                pa.product = product;
                return pa;
              }
            },
          );
          const productAnalysesByProduct = await Promise.all(
            productAnalysesByProductPromise,
          );
          if (newTotalSaleQuantity !== oldTotalSaleQuantity) {
            product.saleQuantityHistory = newTotalSaleQuantity;
            updateProducts.push(product);
          }

          return productAnalysesByProduct;
        },
      );

      // Insert
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const productAnalyses = await Promise.all(productAnalysesPromise);
        const productAnalysesArr: ProductAnalysis[] =
          _.flatten(productAnalyses);
        await queryRunner.manager.save(productAnalysesArr);
        await queryRunner.manager.save(updateProducts);
        await queryRunner.commitTransaction();
        this.logger.log(
          `Refresh product analysis ${productAnalysesArr.length}`,
          context,
        );
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException(
          `Error when refresh product analysis: ${error.message}`,
        );
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(
        `Error when handle data to refresh product analysis: ${error.message}`,
        error.stack,
        context,
      );
    }
  }
}
