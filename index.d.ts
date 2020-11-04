declare module 'react-s3-uploader' {
  import { Component } from 'react';

  export interface S3Response {
    signedUrl: string;
    publicUrl: string;
    filename: string;
    fileKey: string;
  }

  export interface ReactS3UploaderProps {
    signingUrl?: string;
    signingUrlMethod?: 'GET' | 'POST';
    getSignedUrl?: (file: File, callback: (params: S3Response) => void) => void;
    accept?: string;
    s3path?: string;
    preprocess?: (file: File, next: (file: File) => void) => void;
    onSignedUrl?: (response: S3Response) => void;
    onProgress?: (percent: number, status: string, file: File) => void;
    onError?: (message: string) => void;
    onFinish?: (result: S3Response, file: File) => void;
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
    scrubFilename?: (filename: string) => string;
    [key: string]: any;
  }

  class ReactS3Uploader extends Component<ReactS3UploaderProps, unknown> { }

  export default ReactS3Uploader;
}

declare module 'react-s3-uploader/s3upload' {
  import { ReactS3UploaderProps, S3Response } from 'react-s3-uploader';

  export interface S3UploadOptions extends Pick<
    ReactS3UploaderProps,
    | 'contentDisposition'
    | 'getSignedUrl'
    | 'onProgress'
    | 'onError'
    | 'onSignedUrl'
    | 'preprocess'
    | 's3path'
    | 'server'
    | 'signingUrl'
    | 'signingUrlHeaders'
    | 'signingUrlMethod'
    | 'signingUrlQueryParams'
    | 'signingUrlWithCredentials'
    | 'uploadRequestHeaders'> {
    fileElement?: HTMLInputElement | null;
    files?: HTMLInputElement['files'] | null;
    onFinishS3Put?: ReactS3UploaderProps['onFinish'];
    successResponses?: number[];
    scrubFilename?: (filename: string) => string;
  }

  class S3Upload {
    constructor(options: ReactS3UploaderProps);
    abortUpload(): void;
    uploadFile(file: File): Promise<S3Response>;
    uploadToS3(file: File, signResult: S3Response): void;
  }

  export default S3Upload;
}
