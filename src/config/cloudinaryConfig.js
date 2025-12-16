import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export const uploadToCloudinary = async (filePath, options = {}) => {
    try {
        const defaultOptions = {
            folder: 'laporan_resmi',
            resource_type: 'raw',
            ...options
        };

        const result = await cloudinary.uploader.upload(filePath, defaultOptions);

        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type,
            format: result.format,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};


export const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw'
        });

        return {
            success: result.result === 'ok',
            result: result.result
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};


export const getCloudinaryUrl = (publicId) => {
    return cloudinary.url(publicId, {
        secure: true,
        resource_type: 'raw'
    });
};

export const getSignedUrl = (publicId) => {
    return cloudinary.url(publicId, {
        secure: true,
        resource_type: 'raw',
        sign_url: true,
        type: 'authenticated'
    });
};

export const downloadFromCloudinary = async (publicId) => {
    try {
        const signedUrl = cloudinary.url(publicId, {
            secure: true,
            resource_type: 'raw',
            sign_url: true
        });

        const response = await fetch(signedUrl);
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        return {
            success: true,
            buffer: Buffer.from(buffer),
            size: buffer.byteLength
        };
    } catch (error) {
        console.error('Cloudinary download error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

export default cloudinary;
