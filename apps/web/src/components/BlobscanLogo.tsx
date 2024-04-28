import NextImage from "next/image";
import Link from "next/link";

export const BlobscanLogo: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <Link href="/" className="flex justify-center items-center gap-2">
    <NextImage
      className={`block ${className} object-contain w-[40px] h-[40px]`}
      src="/logo.svg"
      width="0"
      height="0"
      sizes="100vw"
      priority
      alt="blobscan-logo"
    />
    <h1>EthStorage Blob Scan</h1>
  </Link>
);
