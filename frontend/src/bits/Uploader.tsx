import { useState } from 'react';
import { S3 } from 'aws-sdk';
import { Auth } from '@aws-amplify/auth';

const Uploader = () => {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        // Get the current logged in user
        const cognitoUser = await Auth.currentAuthenticatedUser();

        // Get the user tokens
        const { idToken: { jwtToken } } = cognitoUser.signInUserSession;

        // Instantiate a new S3 object
        const s3 = new S3();

        // Set up the parameters for the S3 upload
        const params = {
            Bucket: 'YOUR_BUCKET_NAME',
            Key: file.name,
            ContentType: file.type,
            Body: file,
        };

        // Create a new Multipart upload
        const multipart = await s3.createMultipartUpload(params).promise();

        // Calculate the part size
        const partSize = Math.ceil(file.size / 10000);

        // An array to store the ETags of each part
        const ETags = [];

        for (let i = 0; i < file.size; i += partSize) {
            // Get the part to upload
            const part = file.slice(i, i + partSize);

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
    };

    return (
        <div>
            <div
                style={{
                    width: '200px',
                    height: '200px',
                    border: '2px dashed #aaaaaa',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                }}
            >
                {file ? (
                    <p>File selected: {file.name}</p>
                ) : (
                    <p>Drag & drop a file here or click to select</p>
                )}
            </div>
            <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={handleUpload} disabled={!file}>
                Upload
            </button>
        </div>
    );
};

export default Uploader;
