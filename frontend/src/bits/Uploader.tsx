import { useState } from 'react';
import AWS, { S3 } from 'aws-sdk';
import { Auth } from '@aws-amplify/auth';
import { format } from 'url';

require('dotenv').config()

const Uploader = () => {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const AWS_ACCESS_KEY = process.env.REACT_APP_AWS_ACCESSID;
    const AWS_SECRET_KEY = process.env.REACT_APP_AWS_SECRETKEY;
    const Bucket = process.env.BUCKET;

    AWS.config.update({
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_SECRET_KEY,
        region: 'ap-northeast-1'
    });

    const handleUpload = async () => {
        // Get the current logged in user
        // const cognitoUser = await Auth.currentAuthenticatedUser();

        // Get the user tokens
        // const { idToken: { jwtToken } } = cognitoUser.signInUserSession;

        // Instantiate a new S3 object
        const s3 = new S3();

        const params = {
            Bucket: Bucket,
            Key: file.name,
        };

        // Create a new Multipart upload
        const multipart = await s3.createMultipartUpload(params).promise();

        const desiredPartSize = 10 * 1024 * 1024; // 10MB in bytes

        // Calculate the part size
        const partSize = Math.min(desiredPartSize, file.size);

        // An array to store the ETags of each part
        const ETags = [];

        for (let i = 0; i < file.size; i += partSize) {
            const partEnd = Math.min(i + partSize, file.size); // Ensure the last part is within the file size
            // Get the part to upload
            const part = file.slice(i, partEnd);

            // Upload the part
            const upload = await s3.uploadPart({
                ...params,
                PartNumber: Math.floor(i / partSize) + 1,
                UploadId: multipart.UploadId,
                Body: part,
            }).promise();

            // Store the ETag
            ETags.push({
                PartNumber: Math.floor(i / partSize) + 1,
                ETag: upload.ETag,
            });
        }


        // Complete the Multipart upload
        await s3.completeMultipartUpload({
            ...params,
            UploadId: multipart.UploadId,
            MultipartUpload: {
                Parts: ETags,
            },
        }).promise();

        console.log("Upload Successful!");
    };

    return (
        <div style={
            {
                display: 'flex',
                flexDirection: 'column',
                color: '#cdcdcd'
            }
        }>
            <div
                style={{
                    width: '200px',
                    color: '#cdcdcd',
                    height: '200px',
                    border: '2px dashed #aaaaaa',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
            // onDragOver={handleDragOver}
            // onDrop={handleDrop}
            >
                {file ? (
                    <p>File selected: {file.name}</p>
                ) : (
                    <p>Drag & drop a file here or click to select</p>
                )}
            </div>
            <input type="file" onChange={handleFileChange} /* style={{ display: 'none' }} */ />
            <button onClick={handleUpload} /* disabled={!file} */>
                Upload
            </button>
        </div>
    );
};

export default Uploader;

