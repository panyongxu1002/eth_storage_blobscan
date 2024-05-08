import type { NextPage } from "next";

const Monitoring: NextPage = () => {
  return (
    <iframe
      title="ethstorage"
      src="https://grafana.ethstorage.io/d-solo/fdfcc57c-30fb-424e-8dc5-b0cf7bcce84b/ethstorage-monitoring?orgId=2&refresh=5m&from=now-1m&to=now&panelId=13"
      width="100%"
      height="600"
    />
  );
};

export default Monitoring;
