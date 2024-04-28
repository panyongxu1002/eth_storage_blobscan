// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// snippet-start:[javascript.v3.s3.hello]
import {
  ListBucketsCommand,
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import { fileURLToPath } from "url";

const config: any = {
  region: process.env.AWS_S3_STORAGE_REGION, // 替换为你的AWS区域
  credentials: {
    accessKeyId: process.env.AWS_S3_STORAGE_KEY_ID, // 替换为你的AWS访问密钥ID
    secretAccessKey: process.env.AWS_S3_SERVICE_KEY, // 替换为你的AWS秘密访问密钥
  },
};
// 配置 AWS 认证信息
const s3Client = new S3Client(config);

// 执行上传操作
export const upload_AWS_S3 = async ({ versionedHash, data }: any) => {
  // 创建一个可读流来读取文件
  const jsonString = JSON.stringify(data);
  // console.log("🚀 ~ constupload_AWS_S3= ~ jsonString:", jsonString);
  // 写入 JSON 字符串到文件
  fs.writeFileSync(`${versionedHash}.txt`, jsonString);

  const fileStream = fs.createReadStream(`${versionedHash}.txt`);

  // console.log("🚀 ~ constupload_AWS_S3= ~ fileStream:", fileStream);
  // 设置 S3 中的文件名称和路径
  const uploadParams = {
    Bucket: process.env.AWS_S3_STORAGE_BUCKET_NAME, // 替换为你的S3存储桶名称
    Key: `${versionedHash}.txt`, // 文件名及路径
    Body: fileStream, // 文件流
  };
  // console.log("🚀 ~ constupload_AWS_S3= ~ uploadParams:", uploadParams);
  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log("File uploaded successfully. File location:", data.ETag);
  } catch (err) {
    console.error("Error uploading file:", err);
  } finally {
    // 关闭文件流
    fileStream.close();
    // 删除临时文件
    fs.unlinkSync(`${versionedHash}.txt`);
  }
};
