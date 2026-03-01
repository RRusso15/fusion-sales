"use client";

import { UploadOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";

interface InputStepCardProps {
  fileList: UploadFile[];
  sourceText: string;
  isExtracting: boolean;
  isEnhancing: boolean;
  draftAvailable: boolean;
  onFileListChange: (nextList: UploadFile[]) => void;
  onSourceTextChange: (value: string) => void;
  onExtract: () => void;
  onEnhance: () => void;
}

export const InputStepCard = ({
  fileList,
  sourceText,
  isExtracting,
  isEnhancing,
  draftAvailable,
  onFileListChange,
  onSourceTextChange,
  onExtract,
  onEnhance,
}: InputStepCardProps) => {
  return (
    <Card title="1. Input (Upload or Paste)" className="step-enter">
      <Space orientation="vertical" style={{ width: "100%" }} className="stagger-list">
        <Upload
          beforeUpload={() => false}
          maxCount={1}
          fileList={fileList}
          onChange={({ fileList: nextList }) => onFileListChange(nextList)}
        >
          <Button icon={<UploadOutlined />}>Upload Lead/RFP/Brief</Button>
        </Upload>
        <Input.TextArea
          rows={8}
          value={sourceText}
          onChange={(event) => onSourceTextChange(event.target.value)}
          placeholder="Paste document text here..."
        />
        <Space>
          <Button type="primary" onClick={onExtract} loading={isExtracting} className="press">
            Extract with Heuristic Function
          </Button>
          <Button onClick={onEnhance} loading={isEnhancing} disabled={!draftAvailable} className="press">
            Enhance with AI
          </Button>
        </Space>
      </Space>
    </Card>
  );
};

