import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface ProductImageDisplayProps {
  imageUrl: string | null;
  productName: string;
}

export default function ProductImageDisplay({ imageUrl, productName }: ProductImageDisplayProps) {
  return (
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-0">
        <div className="aspect-[3/2] relative w-full bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Image for ${productName}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint="product photo"
            />
          ) : (
            <Image
              src="https://placehold.co/600x400.png"
              alt="Placeholder image"
              layout="fill"
              objectFit="cover"
              data-ai-hint="placeholder image"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
