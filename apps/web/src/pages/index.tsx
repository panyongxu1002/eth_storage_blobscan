import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { BlobscanLogo } from "~/components/BlobscanLogo";
import { Button } from "~/components/Button";
import { Card } from "~/components/Cards/Card";
// import { MetricCard } from "~/components/Cards/MetricCard";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { BlockCard } from "~/components/Cards/SurfaceCards/BlockCard";
// import { DailyTransactionsChart } from "~/components/Charts/Transaction";
import { Link } from "~/components/Link";
import { SearchInput } from "~/components/SearchInput";
import { SlidableList } from "~/components/SlidableList";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { FullBlock } from "~/types";
import {
  buildBlocksRoute,
  buildTransactionsRoute,
  deserializeBlockOverallStats,
  deserializeFullBlock,
} from "~/utils";

const LATEST_ITEMS_LENGTH = 20;
const DAILY_STATS_TIMEFRAME = "15d";

const CARD_HEIGHT = "sm:h-28";

const Home: NextPage = () => {
  const router = useRouter();
  const {
    data: rawBlocksData,
    error: latestBlocksError,
    isLoading: latestBlocksLoading,
  } = api.block.getAll.useQuery<{ blocks: FullBlock[]; totalBlocks: number }>({
    p: 1,
    ps: LATEST_ITEMS_LENGTH,
    expand: "transaction,blob",
  });
  const { data: rawOverallStats, error: overallStatsErr } =
    api.stats.getAllOverallStats.useQuery();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: dailyTxStats, error: dailyTxStatsErr } =
    api.stats.getTransactionDailyStats.useQuery({
      timeFrame: DAILY_STATS_TIMEFRAME,
    });
  const { error: dailyBlockStatsErr } = api.stats.getBlockDailyStats.useQuery({
    timeFrame: DAILY_STATS_TIMEFRAME,
  });
  const { blocks, transactions } = useMemo(() => {
    if (!rawBlocksData) {
      return { blocks: [], transactions: [], blobs: [] };
    }

    const blocks = rawBlocksData.blocks.map(deserializeFullBlock);
    const transactions = blocks
      .flatMap((b) => b.transactions)
      .slice(0, LATEST_ITEMS_LENGTH);
    const blobs = transactions
      .flatMap(({ blobs, ...t }) => blobs.map((b) => ({ ...b, tx: t })))
      .slice(0, LATEST_ITEMS_LENGTH);

    return {
      blocks,
      transactions,
      blobs,
    };
  }, [rawBlocksData]);
  const overallStats = useMemo(() => {
    if (!rawOverallStats) {
      return;
    }

    return {
      ...rawOverallStats,
      block: deserializeBlockOverallStats(rawOverallStats.block),
    };
  }, [rawOverallStats]);

  const error =
    latestBlocksError ||
    overallStatsErr ||
    dailyTxStatsErr ||
    dailyBlockStatsErr;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalBlobSize = overallStats?.blob?.totalBlobSize;

  return (
    <div className="flex flex-col items-center justify-center gap-12 sm:gap-20">
      <div className=" flex flex-col items-center justify-center gap-8 md:w-8/12">
        <BlobscanLogo />
        <div className="flex w-full max-w-lg flex-col items-stretch justify-center space-y-2">
          <SearchInput />
          <span className="text-center text-sm  text-contentSecondary-light dark:text-contentSecondary-dark">
            Blob transaction explorer for the{" "}
            <Link href="https://www.eip4844.com/" isExternal>
              EIP-4844
            </Link>
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-8 sm:gap-10">
        <div className="grid grid-cols-2 space-y-6 lg:grid-cols-10 lg:gap-6 lg:space-y-0">
          {/* <div className="col-span-2 sm:col-span-4">
            <DailyBlobGasComparisonChart
              days={dailyBlockStats?.days}
              blobAsCalldataGasUsed={
                dailyBlockStats?.totalBlobAsCalldataGasUsed
              }
              blobGasUsed={dailyBlockStats?.totalBlobGasUsed}
              opts={{ toolbox: { show: false } }}
            />
          </div> */}
          {/* <div className="col-span-2 grid w-full grid-cols-2 gap-2 sm:col-span-4 sm:grid-cols-2">
            <MetricCard
              name="Total Blocks"
              metric={{
                value: overallStats?.block?.totalBlocks,
              }}
              compact
            />
            <MetricCard
              name="Total Txs"
              metric={{
                value: overallStats?.transaction?.totalTransactions,
              }}
              compact
            />
            <MetricCard
              name="Total Blobs"
              metric={{
                value: overallStats?.blob?.totalBlobs,
              }}
              compact
            />
            <MetricCard
              name="Total Blob Size"
              metric={{
                value: totalBlobSize ? BigInt(totalBlobSize) : undefined,
                type: "bytes",
              }}
              compact
            />
          </div>
          <div className="col-span-2 sm:col-span-6">
            <DailyTransactionsChart
              days={dailyTxStats?.days}
              transactions={dailyTxStats?.totalTransactions}
              opts={{ toolbox: { show: false } }}
              compact
            />
          </div> */}
        </div>
        <div className="grid grid-cols-1 items-stretch justify-stretch gap-6 lg:grid-cols-2">
          <Card
            header={
              <div className="flex items-center justify-between gap-5">
                <div>Latest Blocks</div>
                <Button
                  variant="outline"
                  label="View All Blocks"
                  onClick={() => void router.push(buildBlocksRoute())}
                />
              </div>
            }
            emptyState="No blocks"
          >
            <div className="h-[660px] sm:h-[630px]">
              {latestBlocksLoading ? (
                <div className="flex flex-col gap-4">
                  {Array(LATEST_ITEMS_LENGTH)
                    .fill(0)
                    .map((_, i) => (
                      <div className={CARD_HEIGHT} key={i}>
                        <BlockCard />
                      </div>
                    ))}
                </div>
              ) : (
                <SlidableList
                  items={blocks?.map((b) => ({
                    id: b.hash,
                    element: (
                      <div className={CARD_HEIGHT} key={b.hash}>
                        <BlockCard block={b} />
                      </div>
                    ),
                  }))}
                />
              )}
            </div>
          </Card>
          <Card
            header={
              <div className="flex items-center justify-between gap-5">
                <div>Latest Blob Transactions</div>
                <Button
                  variant="outline"
                  label="View All Txs"
                  onClick={() => void router.push(buildTransactionsRoute())}
                  className="h-full"
                />
              </div>
            }
            emptyState="No transactions"
          >
            <div className="h-[630px]">
              {latestBlocksLoading ? (
                <div className="flex flex-col gap-3">
                  {Array(LATEST_ITEMS_LENGTH)
                    .fill(0)
                    .map((_, i) => (
                      <div className={CARD_HEIGHT} key={i}>
                        <BlobTransactionCard compact />
                      </div>
                    ))}
                </div>
              ) : (
                <SlidableList
                  items={transactions
                    .filter(
                      (tx) =>
                        tx.to.toLocaleLowerCase() ==
                        "0x804c520d3c084c805e37a35e90057ac32831f96f"
                    )
                    .map((tx) => ({
                      id: tx.hash,
                      element: (
                        <div className={CARD_HEIGHT} key={tx.hash}>
                          <BlobTransactionCard
                            transaction={{
                              from: tx.from,
                              to: tx.to,
                              hash: tx.hash,
                              rollup: tx.rollup,
                              blobGasBaseFee: tx.blobGasBaseFee,
                              blobGasMaxFee: tx.blobGasMaxFee,
                            }}
                            blobs={tx.blobs}
                            compact
                          />
                        </div>
                      ),
                    }))}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
