import { Component } from 'react';

export interface ReactS3UploaderProps {
  signingUrl?: string;
  signingUrlMethod?: 'GET' | 'POST';
  getSignedUrl?: (file: File, callback: (params: { signedUrl: string; }) => any) => any;
  accept?: string;
  s3path?: string;
  preprocess?: (file: File, next: (file: File) => any) => any;
  onSignedUrl?: (response: object) => any;
  onProgress?: (percent: number, status: string, file: File) => any;
  onError?: (message: string) => any;
  onFinish?: (result: object) => any;
  signingUrlHeaders?: {
    additional: object;
  };
  signingUrlQueryParams?: {
    additional: object;
  };
  signingUrlWithCredentials?: boolean;
  uploadRequestHeaders?: object;
  contentDisposition?: string;
  server?: string;
  inputRef?: (ref: HTMLInputElement) => any;
  autoUpload?: boolean;
  [key: string]: any;
}

class ReactS3Uploader extends React.Component<ReactS3UploaderProps, any> { }

export default ReactS3Uploader;
