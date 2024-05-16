import type { NextPage } from "next";

const Monitoring: NextPage = () => {
  return (
    <iframe
      title="ethstorage"
      src="https://grafana.ethstorage.io/d/es-node-mining-state-sepolia/ethstorage-monitoring-sepolia?orgId=2&refresh=5m&from=1715817722383&to=1715839322383"
      width="100%"
      height="1294"
    />
  );
};

export default Monitoring;
