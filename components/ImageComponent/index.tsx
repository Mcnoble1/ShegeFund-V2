import { useState, useEffect } from 'react';
import Image from 'next/image';

const ImageComponent = ({ blob }: { blob: Blob }) => {
  const [imageSrc, setImageSrc] = useState<ArrayBuffer | string>('');

  const convertBlobToDataURL = (blob: Blob) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      // reader.result can be string or ArrayBuffer
      const result = reader.result as ArrayBuffer | string;
      setImageSrc(result);
    };

    reader.readAsDataURL(blob);
  };

  useEffect(() => {
    convertBlobToDataURL(blob);
  }, [blob]);

  return <Image src={imageSrc as string} alt="Campaign Image" />;
};

export default ImageComponent;
